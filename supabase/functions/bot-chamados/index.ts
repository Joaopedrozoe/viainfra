import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';

interface BotState {
  step: 'inicio' | 'placa' | 'corretiva' | 'local' | 'agendamento' | 'descricao' | 'finalizado';
  numeroPrevisto?: string;
  placas?: string[];
  placa?: string;
  corretiva?: boolean;
  local?: 'Canteiro' | 'Oficina';
  agendamento?: string;
  descricao?: string;
  conversationId?: string;
  contactId?: string;
  companyId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { action, state, userMessage, contactInfo, companyId } = await req.json();

    console.log('Bot Action:', action, 'State:', state);

    let botState: BotState = state || { step: 'inicio' };
    let response = '';
    let nextStep = botState.step;

    // Criar ou recuperar contato e conversa
    if (!botState.conversationId && contactInfo) {
      const { data: contact } = await supabaseClient
        .from('contacts')
        .upsert({
          company_id: companyId,
          name: contactInfo.name || 'Cliente Web',
          phone: contactInfo.phone,
          email: contactInfo.email,
        }, { onConflict: 'phone' })
        .select()
        .single();

      if (contact) {
        botState.contactId = contact.id;
        
        const { data: conversation } = await supabaseClient
          .from('conversations')
          .insert({
            company_id: companyId,
            contact_id: contact.id,
            channel: 'web',
            status: 'open',
          })
          .select()
          .single();

        if (conversation) {
          botState.conversationId = conversation.id;
          botState.companyId = companyId;
        }
      }
    }

    // Salvar mensagem do usuário
    if (userMessage && botState.conversationId) {
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: botState.conversationId,
          sender_type: 'user',
          content: userMessage,
        });
    }

    // Fluxo do bot
    switch (botState.step) {
      case 'inicio':
        try {
          const ultimoChamadoRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=ultimoChamado`);
          const ultimoChamadoData = await ultimoChamadoRes.json();
          botState.numeroPrevisto = ultimoChamadoData.numeroChamado || 'N/A';

          const placasRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=placas`);
          const placasData = await placasRes.json();
          botState.placas = placasData.placas || [];

          response = `🎫 **Processo de Abertura de Chamado Iniciado**\n\nNúmero previsto: **${botState.numeroPrevisto}**\n\n📋 Selecione uma placa cadastrada ou digite uma nova:\n\n`;
          botState.placas.forEach((placa, i) => {
            response += `${i + 1}. ${placa}\n`;
          });
          response += `\nOu digite a placa manualmente.`;
          
          nextStep = 'placa';
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          response = '❌ Erro ao iniciar processo. Tente novamente.';
        }
        break;

      case 'placa':
        const placaInput = userMessage?.trim().toUpperCase();
        if (!placaInput) {
          response = '❌ Por favor, informe uma placa válida.';
        } else {
          botState.placa = placaInput;
          response = `✅ Placa: **${placaInput}**\n\n🔧 É uma **manutenção corretiva**?\n\nResponda: **Sim** ou **Não**`;
          nextStep = 'corretiva';
        }
        break;

      case 'corretiva':
        const corretivaInput = userMessage?.toLowerCase();
        if (corretivaInput === 'sim' || corretivaInput === 's') {
          botState.corretiva = true;
          response = '✅ Corretiva: **Sim**\n\n📍 Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
          nextStep = 'local';
        } else if (corretivaInput === 'não' || corretivaInput === 'nao' || corretivaInput === 'n') {
          botState.corretiva = false;
          response = '✅ Corretiva: **Não**\n\n📍 Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
          nextStep = 'local';
        } else {
          response = '❌ Responda apenas **Sim** ou **Não**';
        }
        break;

      case 'local':
        const localInput = userMessage?.toLowerCase();
        if (localInput === 'canteiro') {
          botState.local = 'Canteiro';
          response = '✅ Local: **Canteiro**\n\n📅 Informe a **data e hora do agendamento**:\n\nExemplo: 25/12/2024 14:30';
          nextStep = 'agendamento';
        } else if (localInput === 'oficina') {
          botState.local = 'Oficina';
          response = '✅ Local: **Oficina**\n\n📅 Informe a **data e hora do agendamento**:\n\nExemplo: 25/12/2024 14:30';
          nextStep = 'agendamento';
        } else {
          response = '❌ Responda apenas **Canteiro** ou **Oficina**';
        }
        break;

      case 'agendamento':
        botState.agendamento = userMessage?.trim();
        response = `✅ Agendamento: **${botState.agendamento}**\n\n📝 Descreva o **problema/serviço necessário**:`;
        nextStep = 'descricao';
        break;

      case 'descricao':
        botState.descricao = userMessage?.trim();
        
        try {
          const chamadoPayload = {
            placa: botState.placa,
            corretiva: botState.corretiva ? 'Sim' : 'Não',
            local: botState.local,
            agendamento: botState.agendamento,
            descricao: botState.descricao,
          };

          const createRes = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chamadoPayload),
          });

          const chamadoData = await createRes.json();

          // Salvar no Supabase
          if (botState.companyId && botState.conversationId) {
            await supabaseClient
              .from('chamados')
              .insert({
                company_id: botState.companyId,
                conversation_id: botState.conversationId,
                numero_chamado: chamadoData.numeroChamado || botState.numeroPrevisto || 'N/A',
                google_sheet_id: chamadoData.ID,
                placa: botState.placa!,
                corretiva: botState.corretiva!,
                local: botState.local!,
                agendamento: new Date(botState.agendamento!).toISOString(),
                descricao: botState.descricao!,
                status: 'aberto',
              });

            // Atualizar status da conversa
            await supabaseClient
              .from('conversations')
              .update({ status: 'resolved' })
              .eq('id', botState.conversationId);
          }

          response = `✅ **Chamado criado com sucesso!**\n\n🎫 **Número do chamado:** ${chamadoData.numeroChamado || botState.numeroPrevisto}\n📄 **ID:** ${chamadoData.ID || 'N/A'}\n🚗 **Placa:** ${botState.placa}\n📝 **Descrição:** ${botState.descricao}\n\n✨ Em breve entraremos em contato!`;
          nextStep = 'finalizado';
        } catch (error) {
          console.error('Erro ao criar chamado:', error);
          response = '❌ Erro ao criar chamado. Por favor, tente novamente mais tarde.';
        }
        break;

      case 'finalizado':
        response = '✅ Chamado já foi criado. Obrigado!';
        break;
    }

    // Salvar resposta do bot
    if (response && botState.conversationId) {
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: botState.conversationId,
          sender_type: 'bot',
          content: response,
        });
    }

    return new Response(
      JSON.stringify({ 
        message: response, 
        state: { ...botState, step: nextStep },
        finished: nextStep === 'finalizado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bot-chamados:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
