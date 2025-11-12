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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting agent message tests...');

    // Get all agents
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .in('role', ['admin', 'user', 'manager'])
      .order('name');

    if (agentsError) {
      throw new Error(`Error fetching agents: ${agentsError.message}`);
    }

    console.log(`Found ${agents.length} agents to test`);

    // Get an open WhatsApp conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, contact_id, channel, company_id, contacts(name, phone)')
      .eq('channel', 'whatsapp')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (convError || !conversation) {
      throw new Error('No WhatsApp conversation found');
    }

    console.log(`Using conversation: ${conversation.id} with contact: ${conversation.contacts?.name}`);

    const results = [];

    // Test each agent
    for (const agent of agents) {
      console.log(`\n=== Testing agent: ${agent.name} (${agent.email}) ===`);
      
      const messageContent = `🧪 Teste automático - Mensagem de ${agent.name}`;
      
      // Insert message in database
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: messageContent,
          sender_type: 'agent',
          sender_id: agent.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (msgError) {
        console.error(`❌ Error inserting message for ${agent.name}:`, msgError);
        results.push({
          agent: agent.name,
          success: false,
          error: msgError.message
        });
        continue;
      }

      console.log(`✅ Message inserted for ${agent.name}, ID: ${message.id}`);

      // Send via WhatsApp
      try {
        const sendResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-whatsapp-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            conversation_id: conversation.id,
            message_content: messageContent
          })
        });

        const sendResult = await sendResponse.json();
        
        if (sendResponse.ok) {
          console.log(`✅ WhatsApp message sent for ${agent.name}`);
          results.push({
            agent: agent.name,
            email: agent.email,
            success: true,
            messageId: message.id
          });
        } else {
          console.error(`❌ Failed to send WhatsApp for ${agent.name}:`, sendResult);
          results.push({
            agent: agent.name,
            email: agent.email,
            success: false,
            error: sendResult.error || 'Unknown error'
          });
        }
      } catch (error) {
        console.error(`❌ Error sending WhatsApp for ${agent.name}:`, error);
        results.push({
          agent: agent.name,
          email: agent.email,
          success: false,
          error: error.message
        });
      }

      // Wait 2 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n=== Test Results ===');
    console.log(JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true,
        conversationId: conversation.id,
        contactName: conversation.contacts?.name,
        results 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in test function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
