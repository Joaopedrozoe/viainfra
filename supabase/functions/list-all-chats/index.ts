import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📋 LIST ALL CHATS V2 - Estrutura completa');

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const { instanceName = 'VIAINFRAOFICIAL' } = await req.json().catch(() => ({}));

    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({})
    });

    if (!chatsResponse.ok) {
      throw new Error(`Evolution API error: ${chatsResponse.status}`);
    }

    const allChats = await chatsResponse.json();
    
    // Log structure of first 5 chats
    console.log('\n📊 Estrutura do primeiro chat:');
    if (allChats.length > 0) {
      console.log(JSON.stringify(allChats[0], null, 2));
    }

    // Extract ALL fields from first 15 chats
    const chatList = allChats.slice(0, 15).map((chat: any, index: number) => {
      return {
        position: index + 1,
        // All possible name fields
        name: chat.name,
        pushName: chat.pushName,
        notify: chat.notify,
        // All possible ID fields
        id: chat.id,
        remoteJid: chat.remoteJid,
        jid: chat.jid,
        // Other fields
        lastMsgTimestamp: chat.lastMsgTimestamp,
        unreadCount: chat.unreadCount,
        // Full object keys
        allKeys: Object.keys(chat)
      };
    });

    return new Response(JSON.stringify({
      success: true,
      total: allChats.length,
      firstChatFull: allChats[0],
      chats: chatList
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
