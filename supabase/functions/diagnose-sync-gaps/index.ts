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

  console.log('🔍 DIAGNOSE SYNC GAPS - Finding missing conversations');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { createMissing = false } = await req.json().catch(() => ({}));

    // Get the main instance
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', 'VIAINFRAOFICIAL')
      .limit(1);

    const instance = instances?.[0];
    if (!instance) {
      return new Response(JSON.stringify({ error: 'Instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instanceName = instance.instance_name;
    const companyId = instance.company_id;

    // Fetch ALL chats from Evolution API
    console.log('📥 Fetching ALL chats from Evolution API...');
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`API error: ${chatsResponse.status}`);
    }

    const allChats = await chatsResponse.json();
    console.log(`📊 Evolution API has ${allChats.length} total chats`);

    // Get all existing conversations
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('id, metadata, contact_id, contacts(name, phone)')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    console.log(`📊 Database has ${existingConvs?.length || 0} conversations`);

    // Build map of existing JIDs
    const existingJids = new Set<string>();
    for (const conv of existingConvs || []) {
      const jid = conv.metadata?.remoteJid;
      if (jid) existingJids.add(jid);
    }

    // Find missing chats
    const missingChats: any[] = [];
    const presentChats: any[] = [];

    for (const chat of allChats) {
      const remoteJid = chat.id || chat.remoteJid || chat.jid;
      if (!remoteJid || remoteJid === 'status@broadcast') continue;

      const name = chat.name || chat.pushName || chat.notify || remoteJid;
      const isGroup = remoteJid.includes('@g.us');
      const isLid = remoteJid.includes('@lid');

      if (existingJids.has(remoteJid)) {
        presentChats.push({ remoteJid, name, isGroup, isLid });
      } else {
        missingChats.push({ 
          remoteJid, 
          name, 
          isGroup, 
          isLid,
          lastMsgTimestamp: chat.lastMsgTimestamp,
          unreadCount: chat.unreadCount || 0
        });
      }
    }

    console.log(`\n📋 ANALYSIS:`);
    console.log(`  ✅ Present in CRM: ${presentChats.length}`);
    console.log(`  ❌ Missing from CRM: ${missingChats.length}`);
    
    console.log(`\n📝 MISSING CHATS:`);
    for (const chat of missingChats.slice(0, 30)) {
      console.log(`  - ${chat.name} (${chat.remoteJid}) ${chat.isLid ? '[LID]' : ''} ${chat.isGroup ? '[GROUP]' : ''}`);
    }

    // If createMissing is true, create the missing conversations
    let created: any[] = [];
    if (createMissing && missingChats.length > 0) {
      console.log(`\n🔨 Creating ${missingChats.length} missing conversations...`);

      for (const chat of missingChats) {
        try {
          const { remoteJid, name, isGroup, isLid } = chat;
          
          // Extract phone if available
          let phone: string | null = null;
          if (!isLid && !isGroup) {
            phone = remoteJid.split('@')[0];
            if (!/^\d{10,15}$/.test(phone)) phone = null;
          }

          // Create contact first
          const { data: contact, error: contactErr } = await supabase
            .from('contacts')
            .insert({
              name: name || remoteJid,
              phone,
              company_id: companyId,
              metadata: { 
                remoteJid, 
                isGroup, 
                isLid,
                syncGapFill: true,
                createdAt: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (contactErr) {
            console.log(`  ⚠️ Contact error for ${name}: ${contactErr.message}`);
            continue;
          }

          // Create conversation
          const { data: conv, error: convErr } = await supabase
            .from('conversations')
            .insert({
              contact_id: contact.id,
              company_id: companyId,
              channel: 'whatsapp',
              status: 'open',
              bot_active: false,
              metadata: {
                remoteJid,
                instanceName,
                isGroup,
                isLid,
                syncGapFill: true,
                createdAt: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (convErr) {
            console.log(`  ⚠️ Conversation error for ${name}: ${convErr.message}`);
            continue;
          }

          console.log(`  ✅ Created: ${name}`);
          created.push({ name, remoteJid, conversationId: conv.id });
        } catch (err: any) {
          console.log(`  ❌ Error creating ${chat.name}: ${err.message}`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        apiChats: allChats.length,
        existingConversations: existingConvs?.length || 0,
        missingCount: missingChats.length,
        presentCount: presentChats.length
      },
      missingChats: missingChats.slice(0, 50),
      created: created.length > 0 ? created : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
