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

    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversationId || '6033f765-cb84-45ff-858c-ea51fc444529';
    const content = body.content || 'Entendi, pode deixar para o próximo pra ficar junto com os outros';
    const senderType = body.senderType || 'user';
    const timestamp = body.timestamp || '2025-12-19T17:10:00.000Z';

    console.log(`\n📝 Inserting missing message`);
    console.log(`   Conversation: ${conversationId}`);
    console.log(`   Content: ${content}`);
    console.log(`   Sender: ${senderType}`);
    console.log(`   Time: ${timestamp}`);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        content: content,
        created_at: timestamp,
        metadata: {
          source: 'manual_sync',
          note: 'Mensagem inserida manualmente - não estava na Evolution API'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log(`✅ Message inserted: ${data.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
