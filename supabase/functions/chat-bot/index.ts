import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';

interface ChatState {
  mode: 'menu' | 'chamado' | 'atendente';
  chamadoStep?: 'inicio' | 'placa' | 'corretiva' | 'local' | 'agendamento' | 'descricao' | 'finalizado';
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
  waitingForAgent?: boolean;
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

    console.log('Chat Bot Action:', action, 'State:', state);

    let chatState: ChatState = state || { mode: 'menu' };
    let response = '';
    let options: string[] = [];

    // Criar ou recuperar contato e conversa
    if (!chatState.conversationId && contactInfo) {
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
        chatState.contactId = contact.id;
        
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
          chatState.conversationId = conversation.id;
          chatState.companyId = companyId;
        }
      }
    }

    // Salvar mensagem do usuário
    if (userMessage && chatState.conversationId) {
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: chatState.conversationId,
          sender_type: 'user',
          content: userMessage,
        });
    }

    // Roteamento de conversa
    if (chatState.mode === 'menu') {
      response = `👋 Olá! Bem-vindo à **Viainfra**!\n\nComo posso ajudar você hoje?\n\n`;
      options = [
        '1️⃣ Abrir Chamado',
        '2️⃣ Falar com Atendente',
        '3️⃣ Consultar Chamado',
        '4️⃣ FAQ / Dúvidas',
      ];

      const input = userMessage?.trim().toLowerCase();
      
      if (input === '1' || input?.includes('abrir') || input?.includes('chamado')) {
        chatState.mode = 'chamado';
        chatState.chamadoStep = 'inicio';
        
        // Buscar dados para abertura de chamado
        try {
          const ultimoChamadoRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=ultimoChamado`);
          const ultimoChamadoData = await ultimoChamadoRes.json();
          chatState.numeroPrevisto = ultimoChamadoData.numeroChamado || 'N/A';

          const placasRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=placas`);
          const placasData = await placasRes.json();
          chatState.placas = placasData.placas || [];

          response = `🎫 **Processo de Abertura de Chamado Iniciado**\n\nNúmero previsto: **${chatState.numeroPrevisto}**\n\n📋 Selecione uma placa digitando o número correspondente:\n\n`;
          chatState.placas.forEach((placa, i) => {
            response += `${i + 1}. ${placa}\n`;
          });
          response += `\nOu digite uma placa manualmente (ex: ABC1234).`;
          
          options = [];
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          response = '❌ Erro ao iniciar processo de chamado. Tente novamente ou fale com um atendente.';
          chatState.mode = 'menu';
        }
      } else if (input === '2' || input?.includes('atendente') || input?.includes('falar')) {
        chatState.mode = 'atendente';
        chatState.waitingForAgent = true;
        
        // Atribuir conversa para atendente
        await supabaseClient
          .from('conversations')
          .update({ status: 'pending' })
          .eq('id', chatState.conversationId);

        response = `👤 **Aguarde um momento...**\n\nEstou transferindo você para um de nossos atendentes. Em breve alguém irá responder!\n\n💬 Enquanto isso, pode descrever sua necessidade que o atendente verá quando entrar.`;
        options = [];
      } else if (input === '3' || input?.includes('consultar')) {
        response = `🔍 **Consulta de Chamado**\n\nPor favor, informe o **número do chamado** que deseja consultar:`;
        options = [];
      } else if (input === '4' || input?.includes('faq') || input?.includes('duvida')) {
        response = `❓ **Perguntas Frequentes**\n\n1. Como abrir um chamado?\n2. Quanto tempo demora o atendimento?\n3. Como acompanhar meu chamado?\n4. Horário de funcionamento\n\nDigite o número da pergunta ou volte ao menu principal digitando **0**.`;
        options = [];
      } else if (!userMessage || action === 'start') {
        // Primeira mensagem
        response += options.join('\n');
      } else {
        response = `Desculpe, não entendi. Escolha uma das opções acima digitando o número correspondente.`;
      }

    } else if (chatState.mode === 'chamado') {
      // Fluxo de abertura de chamado
      switch (chatState.chamadoStep) {
        case 'inicio':
          // Aguardando seleção da placa
          const input = userMessage?.trim();
          if (!input) {
            response = '❌ Por favor, selecione uma placa da lista ou digite uma placa válida.';
          } else {
            // Verificar se é um número (seleção da lista)
            const numeroSelecionado = parseInt(input);
            let placaSelecionada = '';
            
            if (!isNaN(numeroSelecionado) && chatState.placas && numeroSelecionado > 0 && numeroSelecionado <= chatState.placas.length) {
              // Selecionou da lista
              placaSelecionada = chatState.placas[numeroSelecionado - 1];
            } else {
              // Digite manualmente
              placaSelecionada = input.toUpperCase();
            }
            
            chatState.placa = placaSelecionada;
            response = `✅ Placa selecionada: **${placaSelecionada}**\n\n🔧 É uma **manutenção corretiva**?\n\nResponda: **Sim** ou **Não**`;
            chatState.chamadoStep = 'corretiva';
          }
          break;

        case 'placa':
          const placaInput = userMessage?.trim().toUpperCase();
          if (!placaInput) {
            response = '❌ Por favor, informe uma placa válida.';
          } else {
            chatState.placa = placaInput;
            response = `✅ Placa: **${placaInput}**\n\n🔧 É uma **manutenção corretiva**?\n\nResponda: **Sim** ou **Não**`;
            chatState.chamadoStep = 'corretiva';
          }
          break;

        case 'corretiva':
          const corretivaInput = userMessage?.toLowerCase();
          if (corretivaInput === 'sim' || corretivaInput === 's') {
            chatState.corretiva = true;
            response = '✅ Corretiva: **Sim**\n\n📍 Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
            chatState.chamadoStep = 'local';
          } else if (corretivaInput === 'não' || corretivaInput === 'nao' || corretivaInput === 'n') {
            chatState.corretiva = false;
            response = '✅ Corretiva: **Não**\n\n📍 Qual o **local** do atendimento?\n\nResponda: **Canteiro** ou **Oficina**';
            chatState.chamadoStep = 'local';
          } else {
            response = '❌ Responda apenas **Sim** ou **Não**';
          }
          break;

        case 'local':
          const localInput = userMessage?.toLowerCase();
          if (localInput === 'canteiro') {
            chatState.local = 'Canteiro';
            response = '✅ Local: **Canteiro**\n\n📅 Informe a **data e hora do agendamento**:\n\nExemplo: 25/12/2024 14:30';
            chatState.chamadoStep = 'agendamento';
          } else if (localInput === 'oficina') {
            chatState.local = 'Oficina';
            response = '✅ Local: **Oficina**\n\n📅 Informe a **data e hora do agendamento**:\n\nExemplo: 25/12/2024 14:30';
            chatState.chamadoStep = 'agendamento';
          } else {
            response = '❌ Responda apenas **Canteiro** ou **Oficina**';
          }
          break;

        case 'agendamento':
          chatState.agendamento = userMessage?.trim();
          response = `✅ Agendamento: **${chatState.agendamento}**\n\n📝 Descreva o **problema/serviço necessário**:`;
          chatState.chamadoStep = 'descricao';
          break;

        case 'descricao':
          chatState.descricao = userMessage?.trim();
          
          try {
            const chamadoPayload = {
              placa: chatState.placa,
              corretiva: chatState.corretiva ? 'Sim' : 'Não',
              local: chatState.local,
              agendamento: chatState.agendamento,
              descricao: chatState.descricao,
            };

            const createRes = await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chamadoPayload),
            });

            const chamadoData = await createRes.json();

            // Salvar no Supabase
            if (chatState.companyId && chatState.conversationId) {
              await supabaseClient
                .from('chamados')
                .insert({
                  company_id: chatState.companyId,
                  conversation_id: chatState.conversationId,
                  numero_chamado: chamadoData.numeroChamado || chatState.numeroPrevisto || 'N/A',
                  google_sheet_id: chamadoData.ID,
                  placa: chatState.placa!,
                  corretiva: chatState.corretiva!,
                  local: chatState.local!,
                  agendamento: new Date(chatState.agendamento!).toISOString(),
                  descricao: chatState.descricao!,
                  status: 'aberto',
                });

              // Atualizar status da conversa
              await supabaseClient
                .from('conversations')
                .update({ status: 'resolved' })
                .eq('id', chatState.conversationId);
            }

            response = `✅ **Chamado criado com sucesso!**\n\n🎫 **Número do chamado:** ${chamadoData.numeroChamado || chatState.numeroPrevisto}\n📄 **ID:** ${chamadoData.ID || 'N/A'}\n🚗 **Placa:** ${chatState.placa}\n📝 **Descrição:** ${chatState.descricao}\n\n✨ Em breve entraremos em contato!\n\nDigite **0** para voltar ao menu principal.`;
            
            chatState.chamadoStep = 'finalizado';
            chatState.mode = 'menu';
          } catch (error) {
            console.error('Erro ao criar chamado:', error);
            response = '❌ Erro ao criar chamado. Por favor, tente novamente mais tarde ou fale com um atendente.';
            chatState.mode = 'menu';
          }
          break;

        default:
          response = 'Digite **0** para voltar ao menu principal.';
          chatState.mode = 'menu';
      }

    } else if (chatState.mode === 'atendente') {
      // Modo atendente - apenas salvar mensagem
      if (userMessage === '0') {
        chatState.mode = 'menu';
        chatState.waitingForAgent = false;
        response = '👋 Retornando ao menu principal...\n\n';
        response += '1️⃣ Abrir Chamado\n2️⃣ Falar com Atendente\n3️⃣ Consultar Chamado\n4️⃣ FAQ / Dúvidas';
      } else {
        response = '📩 Mensagem recebida! Um atendente responderá em breve.\n\nDigite **0** para voltar ao menu.';
      }
    }

    // Salvar resposta do bot
    if (response && chatState.conversationId) {
      await supabaseClient
        .from('messages')
        .insert({
          conversation_id: chatState.conversationId,
          sender_type: 'bot',
          content: response,
          metadata: { options: options.length > 0 ? options : null },
        });
    }

    return new Response(
      JSON.stringify({ 
        message: response, 
        state: chatState,
        options: options.length > 0 ? options : null,
        mode: chatState.mode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-bot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
