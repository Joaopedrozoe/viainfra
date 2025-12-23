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

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL') ?? '';
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') ?? '';

    const { action, group_jid } = await req.json().catch(() => ({}));

    console.log('=== RETRY GROUP MESSAGES ===');
    console.log('Action:', action || 'process');
    console.log('Specific group:', group_jid || 'all');

    // 1. Buscar mensagens pendentes em grupos
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('message_queue')
      .select('*, conversations!inner(metadata, company_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Erro ao buscar mensagens:', fetchError);
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Encontradas ${pendingMessages?.length || 0} mensagens pendentes total`);

    // Filtrar apenas mensagens de grupos
    const groupMessages = (pendingMessages || []).filter((m: any) => {
      const remoteJid = m.conversations?.metadata?.remoteJid || '';
      if (group_jid) {
        return remoteJid === group_jid;
      }
      return remoteJid.includes('@g.us');
    });

    console.log(`Mensagens de grupos: ${groupMessages.length}`);

    if (action === 'list') {
      // Apenas listar, não processar
      return new Response(JSON.stringify({
        success: true,
        count: groupMessages.length,
        messages: groupMessages.map((m: any) => ({
          id: m.id,
          content: m.content?.substring(0, 100),
          groupJid: m.conversations?.metadata?.remoteJid,
          status: m.status,
          error: m.error_message,
          retryCount: m.retry_count,
          createdAt: m.created_at
        }))
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'clear') {
      // Limpar mensagens pendentes marcando como failed
      const ids = groupMessages.map((m: any) => m.id);
      
      if (ids.length > 0) {
        const { error: updateError } = await supabase
          .from('message_queue')
          .update({ 
            status: 'failed',
            error_message: 'Limpeza manual - grupo não suportado ou mensagem expirada'
          })
          .in('id', ids);
        
        if (updateError) {
          console.error('Erro ao limpar:', updateError);
          return new Response(JSON.stringify({ success: false, error: updateError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        cleared: ids.length,
        message: `${ids.length} mensagens marcadas como failed`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Ação padrão: processar (reenviar)
    const results: { success: any[]; failed: any[] } = { success: [], failed: [] };
    const instanceName = 'VIAINFRAOFICIAL';

    for (const msg of groupMessages) {
      const groupJid = msg.conversations?.metadata?.remoteJid;
      
      if (!groupJid) {
        console.log(`Mensagem ${msg.id} sem remoteJid, pulando`);
        results.failed.push({ id: msg.id, error: 'No remoteJid' });
        continue;
      }

      console.log(`\n📤 Processando mensagem ${msg.id} para grupo ${groupJid}`);

      try {
        // Marcar como processing
        await supabase
          .from('message_queue')
          .update({ status: 'processing' })
          .eq('id', msg.id);

        // Usar a nova estratégia de envio para grupos
        const groupPayload = {
          number: groupJid,
          options: {
            delay: 1500,
            presence: 'composing'
          },
          textMessage: {
            text: msg.content
          }
        };

        console.log('Payload:', JSON.stringify(groupPayload));

        const response = await fetch(`${evolutionUrl}/message/sendMessage/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify(groupPayload),
        });

        const responseText = await response.text();
        console.log(`Response: ${response.status}`, responseText);

        if (response.ok) {
          // Sucesso! Marcar como sent
          await supabase
            .from('message_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              error_message: null
            })
            .eq('id', msg.id);

          results.success.push({ id: msg.id, groupJid });
          console.log(`✅ Mensagem ${msg.id} enviada com sucesso!`);
        } else {
          // Falha - incrementar retry ou marcar como failed
          const newRetryCount = (msg.retry_count || 0) + 1;
          const maxRetries = msg.max_retries || 3;

          if (newRetryCount >= maxRetries) {
            await supabase
              .from('message_queue')
              .update({ 
                status: 'failed',
                retry_count: newRetryCount,
                error_message: `Max retries atingido. Último erro: ${responseText.substring(0, 200)}`
              })
              .eq('id', msg.id);
          } else {
            await supabase
              .from('message_queue')
              .update({ 
                status: 'pending',
                retry_count: newRetryCount,
                scheduled_at: new Date(Date.now() + 5 * 60000).toISOString(), // Retry em 5 min
                error_message: responseText.substring(0, 200)
              })
              .eq('id', msg.id);
          }

          results.failed.push({ id: msg.id, groupJid, error: responseText.substring(0, 100) });
          console.log(`❌ Mensagem ${msg.id} falhou: ${responseText.substring(0, 100)}`);
        }

        // Delay entre mensagens para não sobrecarregar
        await new Promise(r => setTimeout(r, 2000));

      } catch (error: any) {
        console.error(`Erro ao processar mensagem ${msg.id}:`, error);
        
        await supabase
          .from('message_queue')
          .update({ 
            status: 'pending',
            retry_count: (msg.retry_count || 0) + 1,
            error_message: error.message
          })
          .eq('id', msg.id);

        results.failed.push({ id: msg.id, error: error.message });
      }
    }

    console.log('\n📊 RESUMO:');
    console.log(`Sucesso: ${results.success.length}`);
    console.log(`Falha: ${results.failed.length}`);

    return new Response(JSON.stringify({
      success: true,
      processed: groupMessages.length,
      results
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
