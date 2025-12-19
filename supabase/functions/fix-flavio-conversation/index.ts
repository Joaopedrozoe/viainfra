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

  // Skip auth for this one-time cleanup function
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const conversationId = 'c18a76fd-4a13-4436-aeb8-32ab004fc2d5';
    const legitMessageId = '78920bb9-15c0-4249-916d-9395e9939cec';

    // IDs das mensagens incorretas para deletar
    const incorrectMessageIds = [
      '9f624657-9d60-4c83-a799-5fc82355aa9d', // Imagem 17/12 16:00
      'f23fffa1-0516-4a96-9a47-5783e4896706', // "Boa tarde" 17/12 16:00
      '106b6305-1223-41c6-b984-0f04de14ecb5', // Imagem 18/12 18:52
      'd46813c2-64c3-4c03-a04b-3446daa99bca', // Imagem 19/12 15:58
      '45dde57b-db81-4f15-a9cc-e89e701fbb10', // "Boa tarde" 19/12 15:58
      '971d79af-58f5-4941-898f-17ec9f6a72b4', // Mensagem bot duplicada
    ];

    console.log('=== INICIANDO LIMPEZA DA CONVERSA FLÁVIO ===');
    console.log('Conversation ID:', conversationId);
    console.log('Mensagem legítima a manter:', legitMessageId);
    console.log('Mensagens a deletar:', incorrectMessageIds.length);

    // 1. Verificar estado atual
    const { data: currentMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    console.log('Mensagens atuais na conversa:', currentMessages?.length);
    console.log('Mensagens:', currentMessages?.map(m => ({
      id: m.id,
      content: m.content?.substring(0, 50),
      sender: m.sender_type
    })));

    // 2. Deletar mensagens incorretas
    const { error: deleteError, count: deletedCount } = await supabase
      .from('messages')
      .delete()
      .in('id', incorrectMessageIds);

    if (deleteError) {
      console.error('Erro ao deletar mensagens:', deleteError);
      throw deleteError;
    }

    console.log('Mensagens deletadas com sucesso');

    // 3. Buscar metadata atual da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('metadata, bot_active')
      .eq('id', conversationId)
      .single();

    if (convError) {
      console.error('Erro ao buscar conversa:', convError);
      throw convError;
    }

    console.log('Metadata atual:', conversation?.metadata);
    console.log('Bot ativo:', conversation?.bot_active);

    // 4. Limpar lidJid incorreto do metadata e desativar bot
    const currentMetadata = conversation?.metadata || {};
    const cleanedMetadata = {
      ...currentMetadata,
      lidJid: null, // Remover LID incorreto
      incorrectLidRemoved: true,
      cleanedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        metadata: cleanedMetadata,
        bot_active: false // Desativar bot
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Erro ao atualizar conversa:', updateError);
      throw updateError;
    }

    console.log('Conversa atualizada - bot desativado e metadata limpo');

    // 5. Verificar estado final
    const { data: finalMessages, error: finalError } = await supabase
      .from('messages')
      .select('id, content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    console.log('=== ESTADO FINAL ===');
    console.log('Mensagens restantes:', finalMessages?.length);
    console.log('Mensagens:', finalMessages?.map(m => ({
      id: m.id,
      content: m.content?.substring(0, 50),
      sender: m.sender_type,
      created: m.created_at
    })));

    return new Response(JSON.stringify({
      success: true,
      conversationId,
      messagesDeleted: incorrectMessageIds.length,
      messagesRemaining: finalMessages?.length || 0,
      remainingMessages: finalMessages,
      botDeactivated: true,
      metadataCleaned: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
