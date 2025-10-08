import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0viYlAJ_-v00BzqRgMROE0wdvixohvQ4d949mTvRQk_eRdqN-CsxQeAldpV6HR2xlBQ/exec';

interface ChatState {
  mode: 'menu' | 'chamado' | 'atendente' | 'escolhendoSetor';
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
  selectedSetor?: string;
  selectedAgent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IMPORTANTE: Usar SERVICE_ROLE para bypassar RLS e permitir criação de contatos/conversas
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, state, userMessage, contactInfo, companyId } = await req.json();

    console.log('Chat Bot Action:', action, 'State:', state);

    let chatState: ChatState = state || { mode: 'menu' };
    let response = '';
    let options: string[] = [];

    // Criar ou recuperar contato e conversa
    if (!chatState.conversationId && contactInfo) {
      console.log('Criando contato e conversa para company:', companyId);
      
      try {
        // Criar contato
        const { data: contact, error: contactError } = await supabaseClient
          .from('contacts')
          .insert({
            company_id: companyId,
            name: contactInfo.name || 'Cliente Web',
            phone: contactInfo.phone,
            email: contactInfo.email,
          })
          .select()
          .single();

        if (contactError) {
          console.error('Erro ao criar contato:', contactError);
        } else if (contact) {
          console.log('Contato criado:', contact.id);
          chatState.contactId = contact.id;
          
          // Criar conversa
          const { data: conversation, error: conversationError } = await supabaseClient
            .from('conversations')
            .insert({
              company_id: companyId,
              contact_id: contact.id,
              channel: 'web',
              status: 'open',
            })
            .select()
            .single();

          if (conversationError) {
            console.error('Erro ao criar conversa:', conversationError);
          } else if (conversation) {
            console.log('Conversa criada:', conversation.id);
            chatState.conversationId = conversation.id;
            chatState.companyId = companyId;
          }
        }
      } catch (error) {
        console.error('Erro geral ao criar contato/conversa:', error);
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

    // Verificar se usuário quer voltar ao menu (funciona em qualquer modo)
    if (userMessage?.trim() === '0' && chatState.mode !== 'menu') {
      chatState.mode = 'menu';
      chatState.chamadoStep = undefined;
      chatState.waitingForAgent = false;
      chatState.selectedSetor = undefined;
      chatState.selectedAgent = undefined;
      delete chatState.placas;
      response = `👋 Voltando ao menu principal...\n\nComo posso ajudar você hoje?\n\n`;
      options = [
        '1️⃣ Abrir Chamado',
        '2️⃣ Falar com Atendente 🔧 (Em Manutenção - Disponível em Breve)',
        '3️⃣ Consultar Chamado',
        '4️⃣ FAQ / Dúvidas',
      ];
    }
    // Roteamento de conversa
    else if (chatState.mode === 'menu') {
      response = `👋 Olá! Bem-vindo à **Viainfra**!\n\nComo posso ajudar você hoje?\n\n`;
      options = [
        '1️⃣ Abrir Chamado',
        '2️⃣ Falar com Atendente 🔧 (Em Manutenção - Disponível em Breve)',
        '3️⃣ Consultar Chamado',
        '4️⃣ FAQ / Dúvidas',
      ];

      const input = userMessage?.trim().toLowerCase();
      
      if (input === '1' || input?.includes('abrir') || input?.includes('chamado')) {
        chatState.mode = 'chamado';
        chatState.chamadoStep = 'inicio';
        
        // Buscar dados para abertura de chamado
        try {
          console.log('Iniciando busca de placas...');
          const ultimoChamadoRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=ultimoChamado`);
          const ultimoChamadoData = await ultimoChamadoRes.json();
          chatState.numeroPrevisto = ultimoChamadoData.numeroChamado || 'N/A';
          console.log('Número previsto:', chatState.numeroPrevisto);

          const placasRes = await fetch(`${GOOGLE_SCRIPT_URL}?action=placas`);
          const placasData = await placasRes.json();
          chatState.placas = placasData.placas || [];

          console.log('Placas carregadas:', chatState.placas);
          console.log('Quantidade de placas:', chatState.placas.length);
          console.log('State completo:', JSON.stringify(chatState));

          response = `🎫 **Processo de Abertura de Chamado Iniciado**\n\nNúmero previsto: **${chatState.numeroPrevisto}**\n\n📋 Selecione uma placa:`;
          
          options = []; // Não enviamos options aqui, as placas vão como parte do state
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
          response = '❌ Erro ao iniciar processo de chamado. Tente novamente ou fale com um atendente.';
          chatState.mode = 'menu';
        }
      } else if (input === '2' || input?.includes('atendente') || input?.includes('falar')) {
        response = `🔧 **Atendimento Humano em Manutenção**\n\nDesculpe, o atendimento com nossos agentes está temporariamente indisponível para melhorias.\n\n✨ **Disponível em breve!**\n\nEnquanto isso, você pode:\n• Abrir um chamado (opção 1)\n• Consultar chamados existentes (opção 3)\n• Verificar perguntas frequentes (opção 4)\n\nDigite **0** para voltar ao menu.`;
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

    } else if (chatState.mode === 'escolhendoSetor') {
      // Mapear setores para atendentes
      const agentesSetor: Record<string, string> = {
        "📞 Atendimento": "Joicy Souza",
        "💼 Comercial": "Elisabete Silva",
        "🔧 Manutenção": "Suelem Souza",
        "💰 Financeiro": "Giovanna Ferreira",
        "👥 RH": "Sandra Romano"
      };

      const input = userMessage?.trim();
      const nomeAtendente = agentesSetor[input || ''] || "Atendimento";
      const setorNome = input?.replace(/[📞💼🔧💰👥]\s/, '') || 'Atendimento';

      chatState.selectedSetor = setorNome;
      chatState.selectedAgent = nomeAtendente;
      chatState.mode = 'atendente';
      chatState.waitingForAgent = true;

      // Atribuir conversa para atendente
      if (chatState.conversationId) {
        await supabaseClient
          .from('conversations')
          .update({ 
            status: 'pending',
            metadata: { 
              setor: setorNome, 
              atendente: nomeAtendente 
            }
          })
          .eq('id', chatState.conversationId);
      }

      // Sequência de mensagens conforme especificado
      response = `Aguarde um momento, você será atendido por **${nomeAtendente}** do setor ${setorNome}...\n\nOlá! Você está sendo atendido por **${nomeAtendente}**. Como posso ajudá-lo?\n\nEsta conversa foi transferida para nosso atendimento. Aguarde enquanto conectamos você com o atendente responsável. 📞\n\nDigite sua mensagem ou digite **0** para voltar ao menu.`;
      options = [];

    } else if (chatState.mode === 'atendente') {
      // Modo atendimento humano - apenas confirma recebimento
      if (userMessage && userMessage.trim() !== '0') {
        response = `Recebido! Nossa equipe verificará sua solicitação e retornará em breve. 📝\n\nDigite **0** para voltar ao menu principal.`;
        options = [];
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
            chatState.chamadoStep = 'corretiva';
            // CRÍTICO: Limpar as placas do state após seleção
            delete chatState.placas;
            response = `✅ Placa selecionada: **${placaSelecionada}**\n\n🔧 É uma **manutenção corretiva**?\n\nResponda: **Sim** ou **Não**`;
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
          
          let chamadoData: any = null;
          let googleSheetsSucesso = false;
          
          try {
            console.log('=== INICIANDO CRIAÇÃO DE CHAMADO ===');
            console.log('Placa:', chatState.placa);
            console.log('Corretiva:', chatState.corretiva);
            console.log('Local:', chatState.local);
            console.log('Agendamento:', chatState.agendamento);
            console.log('Descrição:', chatState.descricao);
            
            const chamadoPayload = {
              placa: chatState.placa,
              corretiva: chatState.corretiva ? 'Sim' : 'Não',
              local: chatState.local,
              agendamento: chatState.agendamento,
              descricao: chatState.descricao,
            };

            console.log('Enviando para Google Sheets:', JSON.stringify(chamadoPayload));

            const createRes = await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(chamadoPayload),
            });

            console.log('Google Sheets status:', createRes.status);
            
            // Se status é 200 ou 201, considerar sucesso SEMPRE
            if (createRes.status === 200 || createRes.status === 201) {
              googleSheetsSucesso = true;
              console.log('✅ Status', createRes.status, '- Considerando criação bem-sucedida');
              
              const responseText = await createRes.text();
              console.log('Google Sheets resposta raw:', responseText);
              
              try {
                chamadoData = JSON.parse(responseText);
                console.log('Dados parseados:', chamadoData);
              } catch (parseError) {
                console.log('⚠️ Erro ao fazer parse JSON, mas chamado foi criado (status', createRes.status, ')');
                chamadoData = { 
                  numeroChamado: chatState.numeroPrevisto,
                  ID: 'N/A'
                };
              }
            } else {
              console.error('❌ Google Sheets retornou status', createRes.status);
            }

          } catch (googleError) {
            console.error('Erro ao criar no Google Sheets:', googleError);
          }

          // Tentar salvar no Supabase independentemente do resultado do Google Sheets
          try {
            if (chatState.companyId && chatState.conversationId) {
              console.log('Salvando no Supabase...');
              
              const { data: chamadoDB, error: chamadoError } = await supabaseClient
                .from('chamados')
                .insert({
                  company_id: chatState.companyId,
                  conversation_id: chatState.conversationId,
                  numero_chamado: chamadoData?.numeroChamado || chatState.numeroPrevisto || 'N/A',
                  google_sheet_id: chamadoData?.ID || null,
                  placa: chatState.placa!,
                  corretiva: chatState.corretiva!,
                  local: chatState.local!,
                  agendamento: new Date(chatState.agendamento!).toISOString(),
                  descricao: chatState.descricao!,
                  status: 'aberto',
                })
                .select()
                .single();

              if (chamadoError) {
                console.error('Erro ao salvar no Supabase:', chamadoError);
                // Não falhar se Google Sheets funcionou
                if (!googleSheetsSucesso) {
                  throw chamadoError;
                }
              } else {
                console.log('Salvo no Supabase com sucesso:', chamadoDB);
              }

              // Atualizar conversa
              await supabaseClient
                .from('conversations')
                .update({ status: 'resolved' })
                .eq('id', chatState.conversationId);
            }
          } catch (supabaseError) {
            console.error('Erro no Supabase:', supabaseError);
            // Não falhar se Google Sheets funcionou
            if (!googleSheetsSucesso) {
              throw supabaseError;
            }
          }

          // Se chegou aqui e Google Sheets funcionou, considerar sucesso
          if (googleSheetsSucesso) {
            response = `✅ **Chamado criado com sucesso!**\n\n🎫 **Número:** ${chamadoData?.numeroChamado || chatState.numeroPrevisto}\n📄 **ID:** ${chamadoData?.ID || 'N/A'}\n🚗 **Placa:** ${chatState.placa}\n📝 **Descrição:** ${chatState.descricao}\n\n✨ Em breve entraremos em contato!\n\nDigite **0** para voltar ao menu.`;
            chatState.chamadoStep = 'finalizado';
            chatState.mode = 'menu';
          } else {
            console.error('Falha total na criação do chamado');
            response = '❌ Erro ao criar chamado. Por favor, fale com um atendente digitando **2**.';
            chatState.mode = 'menu';
          }
          break;

        default:
          response = 'Digite **0** para voltar ao menu principal.';
          chatState.mode = 'menu';
      }

    } else if (chatState.mode === 'atendente') {
      // Modo atendente - apenas salvar mensagem (0 já é tratado no início)
      response = '📩 Mensagem recebida! Um atendente responderá em breve.\n\nDigite **0** para voltar ao menu.';
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

    // Log para debug
    console.log('=== RESPONSE DEBUG ===');
    console.log('chatState.placas:', chatState.placas);
    console.log('Quantidade de placas:', chatState.placas?.length || 0);
    console.log('chatState.mode:', chatState.mode);
    console.log('chatState.chamadoStep:', chatState.chamadoStep);
    console.log('State completo sendo enviado:', JSON.stringify(chatState));
    
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
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
