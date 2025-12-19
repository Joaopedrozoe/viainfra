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
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || 'https://api.viainfra.chat';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    const body = await req.json().catch(() => ({}));
    const remoteJid = body.remoteJid || '5511975696283@s.whatsapp.net';
    const limit = body.limit || 100;

    console.log(`\n🔄 FETCH FROM DEVICE - ${remoteJid}`);
    
    // Try different Evolution API endpoints to get messages
    const endpoints = [
      // Standard findMessages
      {
        url: `${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`,
        method: 'POST',
        body: { where: { key: { remoteJid } }, limit }
      },
      // Try fetchHistory if available
      {
        url: `${evolutionApiUrl}/chat/fetchHistory/${INSTANCE_NAME}`,
        method: 'POST',
        body: { remoteJid, limit }
      },
      // Try getMessages
      {
        url: `${evolutionApiUrl}/chat/getMessages/${INSTANCE_NAME}`,
        method: 'POST',
        body: { remoteJid, limit }
      },
      // Try with number format
      {
        url: `${evolutionApiUrl}/chat/findMessages/${INSTANCE_NAME}`,
        method: 'POST',
        body: { 
          where: { key: { remoteJid } },
          limit,
          page: { pageSize: limit, offset: 0 }
        }
      }
    ];

    const results: any[] = [];

    for (const endpoint of endpoints) {
      console.log(`\n📡 Trying: ${endpoint.url}`);
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
          body: JSON.stringify(endpoint.body)
        });

        const status = response.status;
        const data = await response.json().catch(() => null);
        
        console.log(`   Status: ${status}`);
        
        if (response.ok && data) {
          const messages = Array.isArray(data) 
            ? data 
            : (data?.messages?.records || data?.messages || data?.data || data?.history || []);
          
          console.log(`   Messages found: ${messages.length}`);
          
          if (messages.length > 0) {
            // Log last 3 messages
            const sorted = [...messages].sort((a: any, b: any) => {
              const tsA = Number(a.messageTimestamp || 0);
              const tsB = Number(b.messageTimestamp || 0);
              return tsB - tsA;
            });

            for (let i = 0; i < Math.min(3, sorted.length); i++) {
              const msg = sorted[i];
              const ts = msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toISOString() : '?';
              const content = extractContent(msg);
              console.log(`   ${i + 1}. ${ts}: ${content.slice(0, 40)}`);
            }
          }
          
          results.push({
            endpoint: endpoint.url,
            status,
            count: messages.length,
            messages: messages.slice(0, 5)
          });
        } else {
          results.push({
            endpoint: endpoint.url,
            status,
            error: data?.message || data?.error || 'Unknown error'
          });
        }
      } catch (err: any) {
        console.log(`   Error: ${err.message}`);
        results.push({
          endpoint: endpoint.url,
          error: err.message
        });
      }
    }

    // Also try to get chat info
    console.log(`\n📊 Getting chat info...`);
    const chatInfoResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: { 'apikey': evolutionApiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: { remoteJid } })
    });
    
    let chatInfo = null;
    if (chatInfoResponse.ok) {
      const chats = await chatInfoResponse.json();
      chatInfo = Array.isArray(chats) 
        ? chats.find((c: any) => c.remoteJid === remoteJid || c.id === remoteJid)
        : chats;
      console.log(`   Chat found:`, JSON.stringify(chatInfo)?.slice(0, 200));
    }

    return new Response(JSON.stringify({
      success: true,
      remoteJid,
      chatInfo,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractContent(msg: any): string {
  if (!msg?.message) return '';
  const m = msg.message;
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage) return '[Imagem]';
  if (m.audioMessage) return '[Áudio]';
  if (m.documentMessage) return '[Documento]';
  return '[Outro]';
}
