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
    
    // Hardcode the correct instance
    const instanceName = 'VIAINFRAOFICIAL';

    // Get company ID
    const { data: instances } = await supabase
      .from('whatsapp_instances')
      .select('company_id')
      .eq('instance_name', instanceName)
      .limit(1);
    
    const companyId = instances?.[0]?.company_id;
    console.log(`Using instance: ${instanceName}, Company: ${companyId}`);

    // Fetch ALL chats from Evolution API
    const chatsResponse = await fetch(`${evolutionApiUrl}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const chatsData = await chatsResponse.json();
    console.log('Chats response status:', chatsResponse.status);
    
    // Handle different response formats
    const allChats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats || chatsData?.data || []);
    console.log(`Total chats from Evolution API: ${allChats.length}`);

    // Also fetch contacts
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
    console.log(`Total contacts from Evolution API: ${allContacts.length}`);

    // Search for Yago and Flávia
    const searchTerms = ['yago', 'flavia', 'flávia', 'sam'];
    
    const matchingChats = allChats.filter((chat: any) => {
      const name = (chat.name || chat.pushName || '').toLowerCase();
      const id = (chat.id || chat.remoteJid || '').toLowerCase();
      return searchTerms.some(term => name.includes(term) || id.includes(term));
    });

    const matchingContacts = allContacts.filter((contact: any) => {
      const name = (contact.pushName || contact.name || '').toLowerCase();
      const id = (contact.id || contact.remoteJid || '').toLowerCase();
      return searchTerms.some(term => name.includes(term) || id.includes(term));
    });

    // Log ALL chat names to find similar names
    const chatNames = allChats.map((c: any) => ({
      name: c.name || c.pushName || 'N/A',
      id: c.id,
      remoteJid: c.remoteJid
    }));

    // Check database for contacts
    const { data: dbContacts } = await supabase
      .from('contacts')
      .select('id, name, phone')
      .eq('company_id', companyId)
      .or('name.ilike.%yago%,name.ilike.%flavia%,name.ilike.%flávia%');

    // Get all conversations from DB to compare
    const { data: dbConversations } = await supabase
      .from('conversations')
      .select(`
        id,
        updated_at,
        contacts!inner(name, phone)
      `)
      .eq('company_id', companyId)
      .eq('channel', 'whatsapp')
      .order('updated_at', { ascending: false })
      .limit(20);

    const result = {
      summary: {
        totalChatsInEvolution: allChats.length,
        totalContactsInEvolution: allContacts.length,
        matchingChats: matchingChats.length,
        matchingContacts: matchingContacts.length,
        dbContactsMatching: dbContacts?.length || 0
      },
      matchingChats: matchingChats.map((c: any) => ({
        name: c.name || c.pushName,
        id: c.id,
        remoteJid: c.remoteJid,
        phone: (c.remoteJid || c.id)?.replace(/@.*/, '')
      })),
      matchingContacts: matchingContacts.map((c: any) => ({
        name: c.pushName || c.name,
        id: c.id,
        phone: c.id?.replace(/@.*/, '')
      })),
      dbMatchingContacts: dbContacts,
      crmTopConversations: dbConversations?.slice(0, 15).map((c: any) => ({
        name: c.contacts?.name,
        phone: c.contacts?.phone,
        updatedAt: c.updated_at
      })),
      allEvolutionChatNames: chatNames.map((c: any) => c.name)
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
