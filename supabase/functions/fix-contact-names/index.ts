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
    const { instanceName } = await req.json().catch(() => ({ instanceName: 'VIAINFRAOFICIAL' }));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    // Get company ID from instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', instanceName)
      .single();

    const companyId = instance?.company_id;
    if (!companyId) {
      throw new Error('Company not found for instance');
    }

    console.log(`🔧 Fixing contacts for company: ${companyId}`);

    // Fetch all contacts from Evolution API
    let contactsFromApi: any[] = [];
    try {
      const contactsRes = await fetch(`${evolutionUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify({})
      });
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        contactsFromApi = Array.isArray(data) ? data : [];
        console.log(`📱 Found ${contactsFromApi.length} contacts from Evolution API`);
      }
    } catch (e) {
      console.log('Could not fetch contacts from API:', e);
    }

    // Build name map from API contacts
    const nameMap: Record<string, string> = {};
    for (const contact of contactsFromApi) {
      const phone = contact.id?.replace(/@.*/, '') || contact.remoteJid?.replace(/@.*/, '');
      const name = contact.pushName || contact.name || contact.verifiedName;
      if (phone && name && !/^\d+$/.test(name)) {
        nameMap[phone] = name;
        // Also map without country code
        if (phone.startsWith('55') && phone.length > 11) {
          nameMap[phone.substring(2)] = name;
        }
      }
    }

    console.log(`📝 Name map has ${Object.keys(nameMap).length} entries`);

    // Get contacts with numeric names
    const { data: numericContacts } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('company_id', companyId);

    let fixedCount = 0;
    const results: any[] = [];

    for (const contact of numericContacts || []) {
      const isNumeric = /^\d+$/.test(contact.name || '');
      if (!isNumeric || !contact.phone) continue;

      // Try to find name in API data
      const apiName = nameMap[contact.phone] || 
                      nameMap[contact.phone.replace(/^55/, '')] ||
                      nameMap['55' + contact.phone];

      if (apiName) {
        const { error } = await supabase
          .from('contacts')
          .update({ name: apiName, updated_at: new Date().toISOString() })
          .eq('id', contact.id);

        if (!error) {
          console.log(`✅ Updated "${contact.name}" → "${apiName}"`);
          results.push({ phone: contact.phone, oldName: contact.name, newName: apiName, status: 'fixed' });
          fixedCount++;
        }
      } else {
        console.log(`⚠️ No name found for ${contact.phone}`);
        results.push({ phone: contact.phone, oldName: contact.name, status: 'not_found' });
      }
    }

    // Check for missing contacts that should exist
    const missingPhones = [
      { phone: '5511958035461', name: 'Suelem Souza' },  // From prints
      { phone: '5511918660567', name: 'Giovanna' },      // From prints (Giih)
    ];

    for (const missing of missingPhones) {
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', missing.phone)
        .eq('company_id', companyId)
        .maybeSingle();

      if (!existing) {
        // Check API for actual name
        const apiName = nameMap[missing.phone] || missing.name;
        
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            company_id: companyId,
            phone: missing.phone,
            name: apiName
          })
          .select()
          .single();

        if (!error && newContact) {
          console.log(`➕ Created missing contact: ${apiName}`);
          
          // Also create conversation
          await supabase.from('conversations').insert({
            company_id: companyId,
            contact_id: newContact.id,
            channel: 'whatsapp',
            status: 'open'
          });
          
          results.push({ phone: missing.phone, name: apiName, status: 'created' });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      fixedCount,
      results,
      message: `Fixed ${fixedCount} contact names`
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
