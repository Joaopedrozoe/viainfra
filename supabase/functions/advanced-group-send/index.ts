import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error('Evolution API credentials not configured');
    }

    const { instance_name, group_jid, message } = await req.json();

    if (!instance_name || !group_jid || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: instance_name, group_jid, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[advanced-group-send] Starting for group: ${group_jid}`);

    const results: any = {
      techniqueA: null,
      techniqueB: null,
      success: false,
      sentVia: null
    };

    // ============================================
    // TÉCNICA A: Mention Sync - Mencionar um admin
    // ============================================
    console.log('[Técnica A] Buscando participantes do grupo...');
    
    try {
      // Buscar participantes
      const participantsResp = await fetch(
        `${EVOLUTION_API_URL}/group/participants/${instance_name}?groupJid=${group_jid}`,
        {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY }
        }
      );

      if (participantsResp.ok) {
        const participantsData = await participantsResp.json();
        console.log('[Técnica A] Participantes:', JSON.stringify(participantsData).substring(0, 500));

        // Encontrar um admin ou superadmin
        const participants = participantsData?.participants || participantsData || [];
        const admin = participants.find((p: any) => 
          p.admin === 'admin' || p.admin === 'superadmin'
        );

        if (admin) {
          const adminJid = admin.id || admin.jid;
          console.log(`[Técnica A] Admin encontrado: ${adminJid}`);

          // Aguardar um pouco para deixar a sessão "aquecer"
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Enviar presença composing
          await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instance_name}`, {
            method: 'POST',
            headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: group_jid, presence: 'composing' })
          });

          await new Promise(resolve => setTimeout(resolve, 1500));

          // Tentar enviar mensagem com menção (invisível)
          // Primeiro, tenta enviar normal após o "warmup" de participantes
          const sendResp = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance_name}`, {
            method: 'POST',
            headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: group_jid,
              text: message
            })
          });

          const sendData = await sendResp.json();
          console.log('[Técnica A] Resposta sendText:', JSON.stringify(sendData));

          if (sendResp.ok && sendData.key?.id) {
            results.techniqueA = { success: true, data: sendData };
            results.success = true;
            results.sentVia = 'techniqueA_after_participants';
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Mensagem enviada via Técnica A (após buscar participantes)',
                messageId: sendData.key.id,
                results 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            results.techniqueA = { success: false, error: sendData };
          }
        } else {
          results.techniqueA = { success: false, error: 'Nenhum admin encontrado' };
        }
      } else {
        const errorText = await participantsResp.text();
        results.techniqueA = { success: false, error: `Falha ao buscar participantes: ${errorText}` };
      }
    } catch (err) {
      console.error('[Técnica A] Erro:', err);
      results.techniqueA = { success: false, error: String(err) };
    }

    // ============================================
    // TÉCNICA B: Reply to Last Message
    // ============================================
    console.log('[Técnica B] Buscando última mensagem do grupo...');

    try {
      // Buscar mensagens recentes do grupo - tentar fetchMessages primeiro
      let messagesData: any = null;
      
      // Tentar endpoint fetchMessages
      const fetchResp = await fetch(
        `${EVOLUTION_API_URL}/chat/fetchMessages/${instance_name}`,
        {
          method: 'POST',
          headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remoteJid: group_jid,
            limit: 10
          })
        }
      );

      console.log('[Técnica B] fetchMessages status:', fetchResp.status);

      if (fetchResp.ok) {
        messagesData = await fetchResp.json();
        console.log('[Técnica B] fetchMessages response:', JSON.stringify(messagesData).substring(0, 1000));
      } else {
        // Fallback para findMessages
        const findResp = await fetch(
          `${EVOLUTION_API_URL}/chat/findMessages/${instance_name}`,
          {
            method: 'POST',
            headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              where: { key: { remoteJid: group_jid } },
              limit: 10
            })
          }
        );

        if (findResp.ok) {
          messagesData = await findResp.json();
          console.log('[Técnica B] findMessages response:', JSON.stringify(messagesData).substring(0, 1000));
        }
      }

      if (messagesData) {
        // Normalizar array de mensagens - suporta múltiplos formatos
        let messages: any[] = [];
        if (Array.isArray(messagesData)) {
          messages = messagesData;
        } else if (messagesData.messages?.records && Array.isArray(messagesData.messages.records)) {
          // Formato paginado: { messages: { total, pages, records: [...] } }
          messages = messagesData.messages.records;
        } else if (messagesData.messages && Array.isArray(messagesData.messages)) {
          messages = messagesData.messages;
        } else if (messagesData.records && Array.isArray(messagesData.records)) {
          messages = messagesData.records;
        } else if (messagesData.data && Array.isArray(messagesData.data)) {
          messages = messagesData.data;
        }

        console.log(`[Técnica B] ${messages.length} mensagens encontradas`);

        const lastMessage = messages.find((m: any) => m.key?.id);

        if (lastMessage) {
          console.log(`[Técnica B] Última mensagem: ${lastMessage.key.id}`);

          // Aguardar
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Enviar presença
          await fetch(`${EVOLUTION_API_URL}/chat/sendPresence/${instance_name}`, {
            method: 'POST',
            headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: group_jid, presence: 'composing' })
          });

          await new Promise(resolve => setTimeout(resolve, 1500));

          // Enviar como resposta à última mensagem
          const replyResp = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance_name}`, {
            method: 'POST',
            headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: group_jid,
              text: message,
              quoted: {
                key: lastMessage.key,
                message: lastMessage.message
              }
            })
          });

          const replyData = await replyResp.json();
          console.log('[Técnica B] Resposta reply:', JSON.stringify(replyData));

          if (replyResp.ok && replyData.key?.id) {
            results.techniqueB = { success: true, data: replyData };
            results.success = true;
            results.sentVia = 'techniqueB_reply';
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: 'Mensagem enviada via Técnica B (reply to last message)',
                messageId: replyData.key.id,
                results 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            // Tentar sem o quoted como fallback
            console.log('[Técnica B] Reply falhou, tentando envio normal após fetch messages...');
            
            const normalResp = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instance_name}`, {
              method: 'POST',
              headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                number: group_jid,
                text: message
              })
            });

            const normalData = await normalResp.json();

            if (normalResp.ok && normalData.key?.id) {
              results.techniqueB = { success: true, data: normalData, method: 'normal_after_fetch' };
              results.success = true;
              results.sentVia = 'techniqueB_normal_after_fetch';
              
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  message: 'Mensagem enviada via Técnica B (normal após fetch messages)',
                  messageId: normalData.key.id,
                  results 
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              results.techniqueB = { success: false, error: normalData };
            }
          }
        } else {
          results.techniqueB = { success: false, error: 'Nenhuma mensagem encontrada no grupo' };
        }
      } else {
        const errorText = await messagesResp.text();
        results.techniqueB = { success: false, error: `Falha ao buscar mensagens: ${errorText}` };
      }
    } catch (err) {
      console.error('[Técnica B] Erro:', err);
      results.techniqueB = { success: false, error: String(err) };
    }

    // Se chegou aqui, ambas técnicas falharam
    console.log('[advanced-group-send] Todas as técnicas falharam:', JSON.stringify(results));

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Todas as técnicas falharam',
        results 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[advanced-group-send] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
