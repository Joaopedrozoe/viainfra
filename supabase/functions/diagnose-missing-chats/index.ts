import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INSTANCE_NAME = 'VIAINFRAOFICIAL';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    console.log('🔍 DIAGNOSE MISSING CHATS');

    // Get company_id
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', INSTANCE_NAME)
      .single();

    const companyId = instance?.company_id;

    // Fetch all chats from Evolution API
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    const apiChats = await chatsResponse.json();
    console.log(`📱 API returned ${apiChats.length} chats`);

    // Get existing conversations
    const { data: existingConvs } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp');

    const existingJids = new Set<string>();
    const existingPhones = new Set<string>();
    for (const conv of existingConvs || []) {
      if (conv.metadata?.remoteJid) {
        existingJids.add(conv.metadata.remoteJid);
        const phone = conv.metadata.remoteJid.split('@')[0];
        if (phone) existingPhones.add(phone);
      }
    }

    // Find missing chats
    const missingChats = [];
    const allChatsInfo = [];

    for (const chat of apiChats) {
      const jid = chat.id || chat.remoteJid || chat.jid;
      if (!jid || jid.includes('@g.us')) continue;

      const name = chat.name || chat.pushName || chat.notify || 'Unknown';
      const phone = jid.split('@')[0];
      const isLid = jid.includes('@lid') || phone.startsWith('cmj');
      
      const chatInfo = {
        jid,
        name,
        phone: isLid ? null : phone,
        isLid,
        exists: existingJids.has(jid) || existingPhones.has(phone)
      };

      allChatsInfo.push(chatInfo);

      if (!chatInfo.exists && !isLid) {
        missingChats.push(chatInfo);
        console.log(`❌ MISSING: ${name} - ${phone}`);
      }
    }

    // For @lid chats, try to find phone from messages
    const lidChatsWithNames = allChatsInfo.filter(c => c.isLid && !c.exists);
    console.log(`\n📋 @lid chats to resolve: ${lidChatsWithNames.length}`);

    for (const lidChat of lidChatsWithNames) {
      console.log(`  🔍 Looking for phone for: ${lidChat.name} (${lidChat.jid})`);
      
      // Fetch last message to try to find phone
      try {
        const messagesResponse = await fetch(`${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            where: { key: { remoteJid: lidChat.jid } },
            limit: 5
          })
        });

        if (messagesResponse.ok) {
          const msgData = await messagesResponse.json();
          let messages = Array.isArray(msgData) ? msgData : (msgData.messages || []);
          
          // Look for participant phone in message data
          for (const msg of messages) {
            const participant = msg.key?.participant || msg.participant;
            if (participant && participant.includes('@s.whatsapp.net')) {
              const phoneFromMsg = participant.split('@')[0];
              if (/^\d{10,15}$/.test(phoneFromMsg)) {
                console.log(`    ✅ Found phone from message: ${phoneFromMsg}`);
                lidChat.phone = phoneFromMsg;
                if (!existingPhones.has(phoneFromMsg)) {
                  missingChats.push({
                    ...lidChat,
                    phone: phoneFromMsg,
                    resolvedFrom: 'message_participant'
                  });
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        console.log(`    ⚠️ Could not fetch messages for ${lidChat.jid}`);
      }
    }

    // Create missing contacts and conversations
    let created = 0;
    for (const missing of missingChats) {
      if (!missing.phone) continue;
      
      // Check if already exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', companyId)
        .eq('phone', missing.phone)
        .maybeSingle();

      let contactId = existingContact?.id;

      if (!contactId) {
        // Create contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: missing.name,
            phone: missing.phone,
            company_id: companyId,
            metadata: { remoteJid: `${missing.phone}@s.whatsapp.net` }
          })
          .select()
          .single();

        if (contactError) {
          console.log(`  ❌ Error creating contact ${missing.name}: ${contactError.message}`);
          continue;
        }
        contactId = newContact.id;
        console.log(`  ✅ Created contact: ${missing.name} (${missing.phone})`);
      }

      // Check if conversation exists for this contact
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', contactId)
        .eq('channel', 'whatsapp')
        .maybeSingle();

      if (!existingConv) {
        // Create conversation
        const { error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_id: contactId,
            company_id: companyId,
            channel: 'whatsapp',
            status: 'open',
            bot_active: true,
            metadata: {
              remoteJid: `${missing.phone}@s.whatsapp.net`,
              instanceName: INSTANCE_NAME
            }
          });

        if (convError) {
          console.log(`  ❌ Error creating conversation: ${convError.message}`);
        } else {
          created++;
          console.log(`  ✅ Created conversation for: ${missing.name}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Total API chats: ${apiChats.length}`);
    console.log(`  @lid chats: ${lidChatsWithNames.length}`);
    console.log(`  Missing valid chats: ${missingChats.filter(m => m.phone).length}`);
    console.log(`  Created: ${created}`);

    return new Response(JSON.stringify({
      success: true,
      totalChats: apiChats.length,
      lidChats: lidChatsWithNames.map(c => ({ name: c.name, jid: c.jid })),
      missingChats: missingChats.filter(m => m.phone),
      created
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
