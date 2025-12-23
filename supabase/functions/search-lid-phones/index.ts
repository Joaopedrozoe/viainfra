import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { searchTerms = ['flavia', 'gilmar', 'luiz', 'rogerio'] } = await req.json().catch(() => ({}));
    
    const instanceName = 'VIAINFRAOFICIAL';

    console.log(`[search-lid-phones] Searching for: ${searchTerms.join(', ')}`);

    // Fetch all chats
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const chatsData = await chatsResponse.json();
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || chatsData?.data || []);

    // Fetch all contacts
    const contactsResponse = await fetch(`${evolutionApiUrl}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const contactsData = await contactsResponse.json();
    const allContacts = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || contactsData?.data || []);

    console.log(`[search-lid-phones] Total chats: ${allChats.length}, contacts: ${allContacts.length}`);

    // Search in chats
    const matchingChats = allChats.filter((c: any) => {
      const name = (c.name || c.pushName || '').toLowerCase();
      return searchTerms.some((term: string) => name.includes(term.toLowerCase()));
    }).map((c: any) => ({
      name: c.name || c.pushName,
      id: c.id,
      remoteJid: c.remoteJid,
      phone: (c.remoteJid || c.id)?.replace(/@.*/, ''),
      hasValidPhone: /^\d{10,15}$/.test((c.remoteJid || c.id)?.replace(/@.*/, '') || '')
    }));

    // Search in contacts
    const matchingContacts = allContacts.filter((c: any) => {
      const name = (c.pushName || c.name || '').toLowerCase();
      return searchTerms.some((term: string) => name.includes(term.toLowerCase()));
    }).map((c: any) => ({
      name: c.pushName || c.name,
      id: c.id,
      phone: c.id?.replace(/@.*/, ''),
      hasValidPhone: /^\d{10,15}$/.test(c.id?.replace(/@.*/, '') || '')
    }));

    // Get all names for debugging
    const allNames = {
      fromChats: allChats.slice(0, 100).map((c: any) => ({
        name: c.name || c.pushName || 'N/A',
        jid: c.remoteJid || c.id
      })).filter((n: any) => n.name !== 'N/A'),
      fromContacts: allContacts.slice(0, 100).map((c: any) => ({
        name: c.pushName || c.name || 'N/A',
        jid: c.id
      })).filter((n: any) => n.name !== 'N/A')
    };

    return new Response(JSON.stringify({
      searchTerms,
      matchingChats,
      matchingContacts,
      allNamesCount: {
        chats: allNames.fromChats.length,
        contacts: allNames.fromContacts.length
      },
      // Show names that might match partially
      possibleMatches: {
        chats: allNames.fromChats.filter((n: any) => 
          searchTerms.some((term: string) => 
            n.name.toLowerCase().includes(term.toLowerCase().substring(0, 3))
          )
        ),
        contacts: allNames.fromContacts.filter((n: any) => 
          searchTerms.some((term: string) => 
            n.name.toLowerCase().includes(term.toLowerCase().substring(0, 3))
          )
        )
      }
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[search-lid-phones] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
