-- ETAPA 2: Criar bot WhatsApp com fluxo de abertura de chamados
-- Este bot replica o fluxo do canal web, adaptado para WhatsApp

-- Buscar o company_id da primeira empresa (ajustar conforme necessário)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Obter a primeira empresa disponível
  SELECT id INTO v_company_id
  FROM public.companies
  LIMIT 1;

  -- Inserir bot WhatsApp se não existir
  INSERT INTO public.bots (
    id,
    company_id,
    name,
    version,
    status,
    channels,
    flows,
    created_at,
    updated_at
  )
  VALUES (
    'bot-whatsapp-viainfra',
    v_company_id,
    'Bot Viainfra WhatsApp',
    '1.0.0',
    'published',
    ARRAY['whatsapp']::text[],
    '{
      "nodes": [
        {
          "id": "start-1",
          "type": "start",
          "position": {"x": 400, "y": 0},
          "data": {
            "label": "Início",
            "message": "👋 Olá! Bem-vindo à Viainfra!\\n\\nComo posso ajudar você hoje?"
          }
        },
        {
          "id": "menu-1",
          "type": "question",
          "position": {"x": 400, "y": 120},
          "data": {
            "label": "Menu Principal",
            "question": "Escolha uma opção:",
            "options": ["Abrir Chamado", "Falar com Atendente", "Consultar Chamado", "FAQ / Dúvidas"]
          }
        },
        {
          "id": "chamado-inicio",
          "type": "action",
          "position": {"x": 100, "y": 280},
          "data": {
            "label": "Buscar Dados Chamado",
            "actionType": "api",
            "action": "Buscar último chamado e placas da API Google Sheets"
          }
        },
        {
          "id": "chamado-placa",
          "type": "question",
          "position": {"x": 100, "y": 400},
          "data": {
            "label": "Selecionar Placa",
            "question": "📋 Selecione uma placa:",
            "options": ["Lista dinâmica de placas da API"]
          }
        },
        {
          "id": "chamado-corretiva",
          "type": "question",
          "position": {"x": 100, "y": 520},
          "data": {
            "label": "Tipo de Manutenção",
            "question": "🔧 É uma manutenção corretiva?",
            "options": ["Sim", "Não"]
          }
        },
        {
          "id": "chamado-local",
          "type": "question",
          "position": {"x": 100, "y": 640},
          "data": {
            "label": "Local do Atendimento",
            "question": "📍 Qual o local do atendimento?",
            "options": ["Canteiro", "Oficina"]
          }
        },
        {
          "id": "chamado-agendamento",
          "type": "action",
          "position": {"x": 100, "y": 760},
          "data": {
            "label": "Data e Hora",
            "actionType": "input",
            "action": "📅 Informe a data e hora do agendamento (ex: 25/12/2024 14:30)"
          }
        },
        {
          "id": "chamado-descricao",
          "type": "action",
          "position": {"x": 100, "y": 880},
          "data": {
            "label": "Descrição",
            "actionType": "input",
            "action": "📝 Descreva o problema/serviço necessário"
          }
        },
        {
          "id": "chamado-criar",
          "type": "action",
          "position": {"x": 100, "y": 1000},
          "data": {
            "label": "Criar Chamado",
            "actionType": "api",
            "action": "Enviar dados para Google Sheets e salvar no Supabase"
          }
        },
        {
          "id": "chamado-sucesso",
          "type": "message",
          "position": {"x": 100, "y": 1120},
          "data": {
            "label": "Chamado Criado",
            "message": "✅ Chamado criado com sucesso!\\n\\nDigite 0 para voltar ao menu principal."
          }
        },
        {
          "id": "atendente-inicio",
          "type": "action",
          "position": {"x": 400, "y": 280},
          "data": {
            "label": "Transferir Atendente",
            "actionType": "transfer",
            "action": "Atualizar status da conversa para \"pending\" e aguardar atendente"
          }
        },
        {
          "id": "atendente-aguardando",
          "type": "message",
          "position": {"x": 400, "y": 400},
          "data": {
            "label": "Aguardando",
            "message": "👤 Aguarde um momento...\\n\\nEstou transferindo você para um atendente.\\n\\nDigite 0 para voltar ao menu."
          }
        },
        {
          "id": "consultar-chamado",
          "type": "action",
          "position": {"x": 700, "y": 280},
          "data": {
            "label": "Consultar Chamado",
            "actionType": "input",
            "action": "🔍 Informe o número do chamado"
          }
        },
        {
          "id": "faq",
          "type": "question",
          "position": {"x": 1000, "y": 280},
          "data": {
            "label": "FAQ",
            "question": "❓ Perguntas Frequentes:",
            "options": ["Como abrir chamado?", "Tempo de atendimento?", "Acompanhar chamado?", "Horário de funcionamento"]
          }
        },
        {
          "id": "end-conversation",
          "type": "end",
          "position": {"x": 400, "y": 1240},
          "data": {
            "label": "Fim",
            "message": "Conversa encerrada ou aguardando próxima ação"
          }
        }
      ],
      "edges": [
        {"id": "e-start-menu", "source": "start-1", "target": "menu-1"},
        {"id": "e-menu-chamado", "source": "menu-1", "target": "chamado-inicio", "label": "Abrir Chamado"},
        {"id": "e-chamado-placa", "source": "chamado-inicio", "target": "chamado-placa"},
        {"id": "e-placa-corretiva", "source": "chamado-placa", "target": "chamado-corretiva"},
        {"id": "e-corretiva-local", "source": "chamado-corretiva", "target": "chamado-local"},
        {"id": "e-local-agendamento", "source": "chamado-local", "target": "chamado-agendamento"},
        {"id": "e-agendamento-descricao", "source": "chamado-agendamento", "target": "chamado-descricao"},
        {"id": "e-descricao-criar", "source": "chamado-descricao", "target": "chamado-criar"},
        {"id": "e-criar-sucesso", "source": "chamado-criar", "target": "chamado-sucesso"},
        {"id": "e-sucesso-end", "source": "chamado-sucesso", "target": "end-conversation"},
        {"id": "e-menu-atendente", "source": "menu-1", "target": "atendente-inicio", "label": "Falar com Atendente"},
        {"id": "e-atendente-aguardando", "source": "atendente-inicio", "target": "atendente-aguardando"},
        {"id": "e-aguardando-end", "source": "atendente-aguardando", "target": "end-conversation"},
        {"id": "e-menu-consultar", "source": "menu-1", "target": "consultar-chamado", "label": "Consultar"},
        {"id": "e-consultar-end", "source": "consultar-chamado", "target": "end-conversation"},
        {"id": "e-menu-faq", "source": "menu-1", "target": "faq", "label": "FAQ"},
        {"id": "e-faq-end", "source": "faq", "target": "end-conversation"}
      ]
    }'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    flows = EXCLUDED.flows,
    channels = EXCLUDED.channels,
    status = EXCLUDED.status,
    updated_at = NOW();

  RAISE NOTICE 'Bot WhatsApp criado/atualizado com sucesso para company_id: %', v_company_id;
END $$;