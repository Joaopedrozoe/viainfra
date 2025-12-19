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
    const conversationId = body.conversationId;
    const idsToDelete = body.idsToDelete as string[] | undefined;

    // Se IDs específicos foram fornecidos, deletar diretamente
    if (idsToDelete && idsToDelete.length > 0) {
      console.log(`🗑️ Deletando ${idsToDelete.length} IDs específicos...`);
      
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Erro ao deletar:', deleteError);
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Atualizar updated_at da conversa se fornecida
      if (conversationId) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsg) {
          await supabase
            .from('conversations')
            .update({ updated_at: lastMsg.created_at })
            .eq('id', conversationId);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        deleted: idsToDelete.length 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🧹 Limpando duplicatas ${conversationId ? `para conversa ${conversationId}` : 'GLOBAL'}...`);

    // Buscar mensagens
    let query = supabase
      .from('messages')
      .select('id, conversation_id, content, sender_type, created_at')
      .order('created_at', { ascending: true });

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data: allMessages, error: queryError } = await query;

    if (queryError || !allMessages) {
      console.error('Query error:', queryError);
      return new Response(JSON.stringify({ error: queryError?.message || 'No messages' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📋 Total de mensagens: ${allMessages.length}`);

    // Agrupar por conversa + conteúdo + MINUTO (não segundo exato)
    // Isso pega duplicatas salvas quase ao mesmo tempo
    const groups = new Map<string, string[]>();
    
    for (const msg of allMessages) {
      // Truncar para o minuto para pegar duplicatas próximas
      const timestamp = new Date(msg.created_at);
      const minuteKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
      
      const key = `${msg.conversation_id}|${msg.content}|${minuteKey}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(msg.id);
    }

    // Encontrar grupos com mais de uma mensagem (duplicatas)
    const idsToDelete: string[] = [];
    
    for (const [key, ids] of groups.entries()) {
      if (ids.length > 1) {
        // Manter o primeiro, deletar o resto
        console.log(`🔍 Duplicata encontrada: ${key.substring(0, 80)}... (${ids.length} msgs)`);
        idsToDelete.push(...ids.slice(1));
      }
    }

    console.log(`🗑️ Total de duplicatas para deletar: ${idsToDelete.length}`);

    if (idsToDelete.length > 0) {
      // Deletar em batches
      const batchSize = 50;
      let deleted = 0;
      
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error('Erro ao deletar batch:', deleteError);
        } else {
          deleted += batch.length;
          console.log(`✅ Batch deletado: ${batch.length} msgs`);
        }
      }

      // Atualizar updated_at das conversas afetadas
      const affectedConvs = [...new Set(allMessages
        .filter(m => idsToDelete.includes(m.id))
        .map(m => m.conversation_id))];

      for (const convId of affectedConvs) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsg) {
          await supabase
            .from('conversations')
            .update({ updated_at: lastMsg.created_at })
            .eq('id', convId);
          console.log(`📅 Conversa ${convId} updated_at atualizado para ${lastMsg.created_at}`);
        }
      }

      console.log(`✅ Limpeza concluída: ${deleted} duplicatas removidas`);

      return new Response(JSON.stringify({
        success: true,
        duplicatesFound: idsToDelete.length,
        deleted: deleted,
        conversationsUpdated: affectedConvs.length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      duplicatesFound: 0,
      message: 'Nenhuma duplicata encontrada'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
