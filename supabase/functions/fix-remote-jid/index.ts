import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, instanceName } = await req.json();
    
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId is required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`\n🔧 FIX REMOTE JID para company: ${companyId}`);
    console.log(`========================================\n`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    // Get contacts without remoteJid
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, phone, metadata')
      .eq('company_id', companyId)
      .not('phone', 'is', null);

    const stats = { total: 0, fixed: 0, alreadyOk: 0, errors: 0 };

    for (const contact of contacts || []) {
      stats.total++;
      
      // Check if already has remoteJid
      if (contact.metadata?.remoteJid) {
        stats.alreadyOk++;
        continue;
      }

      // Build remoteJid from phone
      let phone = contact.phone?.replace(/\D/g, '');
      if (!phone) continue;

      // Normalize phone
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = '55' + phone;
      }

      const remoteJid = `${phone}@s.whatsapp.net`;
      
      try {
        // Update contact metadata
        const newMetadata = {
          ...(contact.metadata || {}),
          remoteJid
        };

        await supabase.from('contacts').update({
          metadata: newMetadata,
          updated_at: new Date().toISOString()
        }).eq('id', contact.id);

        // Also update conversation metadata
        const { data: conversation } = await supabase.from('conversations')
          .select('id, metadata')
          .eq('contact_id', contact.id)
          .eq('channel', 'whatsapp')
          .maybeSingle();

        if (conversation) {
          await supabase.from('conversations').update({
            metadata: {
              ...conversation.metadata,
              remoteJid,
              instanceName: instanceName || conversation.metadata?.instanceName
            }
          }).eq('id', conversation.id);
        }

        console.log(`✅ Fixed: ${contact.name} -> ${remoteJid}`);
        stats.fixed++;

      } catch (e) {
        console.error(`❌ Error fixing ${contact.name}:`, e);
        stats.errors++;
      }
    }

    // Also fix numeric contact names using Evolution API
    if (evolutionApiUrl && evolutionApiKey && instanceName) {
      console.log(`\n🔧 Fixing numeric names...`);
      
      try {
        const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
          method: 'POST',
          headers: { 'apikey': evolutionApiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          const apiContacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);
          
          const nameMap = new Map<string, string>();
          for (const c of apiContacts) {
            const jid = c.id || c.jid || c.remoteJid;
            const name = c.pushName || c.name || c.notify || c.verifiedName;
            if (jid && name && !jid.includes('@g.us')) {
              const phone = jid.replace(/@.*/, '');
              nameMap.set(phone, name);
              if (phone.startsWith('55')) nameMap.set(phone.slice(2), name);
            }
          }

          // Get contacts with numeric names
          const { data: numericContacts } = await supabase
            .from('contacts')
            .select('id, name, phone')
            .eq('company_id', companyId)
            .not('phone', 'is', null);

          for (const contact of numericContacts || []) {
            if (/^\d+$/.test(contact.name)) {
              const realName = nameMap.get(contact.phone) || 
                              nameMap.get(contact.phone?.replace(/^55/, ''));
              
              if (realName && realName !== contact.name) {
                await supabase.from('contacts').update({
                  name: realName,
                  updated_at: new Date().toISOString()
                }).eq('id', contact.id);
                console.log(`   📝 Name fixed: ${contact.name} -> ${realName}`);
              }
            }
          }
        }
      } catch (e) {
        console.log(`⚠️ Error fixing names: ${e}`);
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ FIX COMPLETE`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Fixed: ${stats.fixed}`);
    console.log(`   Already OK: ${stats.alreadyOk}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`========================================\n`);

    return new Response(JSON.stringify({
      success: true,
      stats
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal error',
      details: String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
