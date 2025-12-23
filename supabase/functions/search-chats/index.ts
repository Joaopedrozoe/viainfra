import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔍 SEARCH CHATS - Buscando chats específicos');

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';
    const { 
      instanceName = 'VIAINFRAOFICIAL',
      searchTerms = ['yago', 'flávia financeiro', 'flavia financeiro']
    } = await req.json().catch(() => ({}));

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
    console.log(`📊 Total chats: ${allChats.length}`);

    // Search for matching names
    const matches: any[] = [];
    const allNames: string[] = [];
    
    for (let i = 0; i < allChats.length; i++) {
      const chat = allChats[i];
      const name = (chat.pushName || chat.name || '').toLowerCase();
      allNames.push(`${i+1}. ${chat.pushName || 'Unknown'} (${chat.remoteJid})`);
      
      for (const term of searchTerms) {
        if (name.includes(term.toLowerCase())) {
          matches.push({
            position: i + 1,
            name: chat.pushName || chat.name,
            remoteJid: chat.remoteJid,
            phone: chat.remoteJid?.split('@')[0],
            searchTerm: term
          });
        }
      }
    }

    console.log('\n📋 All chat names:');
    for (const n of allNames) {
      console.log(n);
    }

    console.log('\n🎯 Matches:');
    for (const m of matches) {
      console.log(`  ${m.name} (${m.remoteJid})`);
    }

    return new Response(JSON.stringify({
      success: true,
      total: allChats.length,
      searchTerms,
      matches,
      allChatNames: allNames
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
