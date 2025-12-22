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

  console.log('🔍 DIAGNOSE SYNC - Checking Evolution API vs Supabase');

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const instanceName = 'VIAINFRAOFICIAL';
    const companyId = 'da17735c-5a76-4797-b338-f6e63a7b3f8b';

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      conversations: []
    };

    // Test contacts to check
    const testContacts = [
      { name: 'Yago M Sam', jid: '5511991593841@s.whatsapp.net' },
      { name: 'Flavio Gonçalves', jid: '5511941003586@s.whatsapp.net' },
      { name: 'Serviços Zigurate', jid: '120363417019560415@g.us' },
      { name: 'Via & T.Informatica', jid: '120363421810878254@g.us' },
    ];

    for (const contact of testContacts) {
      console.log(`\n📱 Checking: ${contact.name}`);
      
      const convDiag: any = {
        name: contact.name,
        jid: contact.jid,
        evolutionApi: null,
        supabase: null,
        discrepancy: null
      };

      // 1. Get messages from Evolution API
      try {
        const apiResp = await fetch(`${evolutionApiUrl}/chat/findMessages/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            where: { key: { remoteJid: contact.jid } },
            limit: 5
          })
        });

        if (apiResp.ok) {
          const data = await apiResp.json();
          let messages: any[] = [];
          
          if (Array.isArray(data)) messages = data;
          else if (data.messages?.records) messages = data.messages.records;
          else if (data.messages) messages = data.messages;
          else if (data.records) messages = data.records;

          const lastMsgs = messages.slice(0, 3).map((m: any) => {
            const content = extractContent(m);
            const ts = Number(m.messageTimestamp || 0);
            const timestampMs = ts > 1e12 ? ts : ts * 1000;
            return {
              id: m.key?.id || m.id,
              content: content?.substring(0, 50),
              timestamp: new Date(timestampMs).toISOString(),
              fromMe: m.key?.fromMe || false
            };
          });

          convDiag.evolutionApi = {
            totalMessages: messages.length,
            recentMessages: lastMsgs
          };
          
          console.log(`  📡 Evolution API: ${messages.length} messages, latest: ${lastMsgs[0]?.content?.substring(0, 30) || 'N/A'}`);
        } else {
          console.log(`  ❌ Evolution API error: ${apiResp.status}`);
          convDiag.evolutionApi = { error: `HTTP ${apiResp.status}` };
        }
      } catch (apiErr: any) {
        console.log(`  ❌ Evolution API exception: ${apiErr.message}`);
        convDiag.evolutionApi = { error: apiErr.message };
      }

      // 2. Get messages from Supabase
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('company_id', companyId)
          .eq('metadata->>remoteJid', contact.jid)
          .maybeSingle();

        if (conv) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_type, metadata')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(5);

          const lastMsgs = (msgs || []).map(m => ({
            id: m.id,
            content: m.content?.substring(0, 50),
            timestamp: m.created_at,
            senderType: m.sender_type,
            externalId: (m.metadata as any)?.external_id
          }));

          convDiag.supabase = {
            conversationId: conv.id,
            totalMessages: msgs?.length || 0,
            recentMessages: lastMsgs
          };
          
          console.log(`  📊 Supabase: ${msgs?.length} messages, latest: ${lastMsgs[0]?.content?.substring(0, 30) || 'N/A'}`);
        } else {
          convDiag.supabase = { error: 'Conversation not found' };
          console.log('  ⚠️ Conversation not found in Supabase');
        }
      } catch (dbErr: any) {
        console.log(`  ❌ Supabase error: ${dbErr.message}`);
        convDiag.supabase = { error: dbErr.message };
      }

      // 3. Compare
      if (convDiag.evolutionApi?.recentMessages && convDiag.supabase?.recentMessages) {
        const apiLatest = convDiag.evolutionApi.recentMessages[0];
        const dbLatest = convDiag.supabase.recentMessages[0];
        
        if (apiLatest && dbLatest) {
          const apiTime = new Date(apiLatest.timestamp).getTime();
          const dbTime = new Date(dbLatest.timestamp).getTime();
          const diffMinutes = Math.abs(apiTime - dbTime) / 60000;
          
          if (diffMinutes > 1) {
            convDiag.discrepancy = {
              type: 'TIMESTAMP_MISMATCH',
              apiLatest: apiLatest.timestamp,
              dbLatest: dbLatest.timestamp,
              diffMinutes: Math.round(diffMinutes)
            };
            console.log(`  ⚠️ DISCREPANCY: API latest ${apiLatest.timestamp} vs DB latest ${dbLatest.timestamp} (${Math.round(diffMinutes)} min diff)`);
          }
          
          // Check if API message exists in DB
          if (apiLatest.id && !convDiag.supabase.recentMessages.some((m: any) => m.externalId === apiLatest.id)) {
            convDiag.discrepancy = {
              ...convDiag.discrepancy,
              missingMessage: apiLatest
            };
            console.log(`  ⚠️ MISSING: API message ${apiLatest.id} not in DB`);
          }
        }
      }

      diagnostics.conversations.push(convDiag);
    }

    console.log('\n✅ Diagnosis complete');

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(msg: any): string {
  const message = msg.message || msg;
  
  if (typeof message === 'string') return message;
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage) return message.imageMessage.caption || '[Imagem]';
  if (message.videoMessage) return message.videoMessage.caption || '[Vídeo]';
  if (message.audioMessage) return '[Áudio]';
  if (message.documentMessage) return '[Documento]';
  if (message.stickerMessage) return '[Figurinha]';
  
  const text = msg.body || msg.text || msg.caption;
  if (text) return text;
  
  return '';
}
