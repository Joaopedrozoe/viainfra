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
    
    const { lid, contactId, conversationId } = await req.json();
    
    console.log(`[resolve-lid] Looking for LID: ${lid}`);

    const instanceName = 'VIAINFRAOFICIAL';

    // Fetch contacts from Evolution API
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
    console.log(`[resolve-lid] Total contacts: ${allContacts.length}`);

    // Find matching contact by LID
    const matchingContact = allContacts.find((c: any) => {
      const contactId = c.id || c.remoteJid || '';
      return contactId.includes(lid);
    });

    if (matchingContact) {
      console.log(`[resolve-lid] Found contact:`, matchingContact);
      
      // Try to extract phone from the contact
      const phone = matchingContact.id?.replace(/@.*/, '') || 
                    matchingContact.remoteJid?.replace(/@.*/, '') ||
                    matchingContact.number;
      
      return new Response(JSON.stringify({
        success: true,
        found: true,
        contact: {
          name: matchingContact.pushName || matchingContact.name,
          id: matchingContact.id,
          phone: phone
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Also try to find in chats
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
    
    // Search by name "Eliomar"
    const matchingChat = allChats.find((c: any) => {
      const name = (c.name || c.pushName || '').toLowerCase();
      return name.includes('eliomar');
    });

    if (matchingChat) {
      console.log(`[resolve-lid] Found chat by name:`, matchingChat);
      
      const phone = matchingChat.id?.replace(/@.*/, '') || 
                    matchingChat.remoteJid?.replace(/@.*/, '');
      
      // If found a phone, update the contact and conversation
      if (phone && /^\d{10,15}$/.test(phone) && contactId) {
        console.log(`[resolve-lid] Updating contact ${contactId} with phone ${phone}`);
        
        await supabase
          .from('contacts')
          .update({ phone: phone })
          .eq('id', contactId);
          
        // Also update lid_phone_mapping
        await supabase
          .from('lid_phone_mapping')
          .upsert({
            lid: lid,
            phone: phone,
            contact_id: contactId,
            instance_name: instanceName
          }, { onConflict: 'lid' });
      }
      
      return new Response(JSON.stringify({
        success: true,
        found: true,
        chat: {
          name: matchingChat.name || matchingChat.pushName,
          id: matchingChat.id,
          remoteJid: matchingChat.remoteJid,
          phone: phone
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // List all contact/chat names to help debug
    const allNames = [
      ...allContacts.slice(0, 50).map((c: any) => ({
        name: c.pushName || c.name || 'N/A',
        id: c.id,
        type: 'contact'
      })),
      ...allChats.slice(0, 50).map((c: any) => ({
        name: c.name || c.pushName || 'N/A',
        id: c.id,
        type: 'chat'
      }))
    ];

    return new Response(JSON.stringify({
      success: true,
      found: false,
      message: `LID ${lid} not found in Evolution API`,
      availableNames: allNames.filter((n: any) => n.name !== 'N/A').map((n: any) => n.name)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[resolve-lid] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
