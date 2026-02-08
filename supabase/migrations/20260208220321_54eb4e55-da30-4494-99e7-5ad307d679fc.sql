-- Inserir fluxo de bot clonado para ViaLogistic
-- Idêntico ao FLUXO-VIAINFRA mas com nome da empresa alterado para ViaLogistic

INSERT INTO public.bots (id, name, company_id, version, status, channels, flows)
VALUES (
  'fluxo-vialogistic',
  'FLUXO-VIALOGISTIC',
  'e3ad9c68-cf12-4e39-a12d-3f3068e975a0',  -- ViaLogistic company ID
  'v1',
  'published',
  '{}',
  '{
    "edges": [
      {"id": "e-start-menu", "type": "smoothstep", "source": "start-1", "target": "menu-1"},
      {"id": "e-menu-chamado", "type": "smoothstep", "label": "1️⃣ Abrir Chamado", "source": "menu-1", "target": "chamado-inicio"},
      {"id": "e-menu-atendente", "type": "smoothstep", "label": "2️⃣ Falar com Atendente", "source": "menu-1", "target": "atendente-inicio"}
    ],
    "nodes": [
      {
        "id": "start-1",
        "data": {
          "label": "Início",
          "message": "👋 Olá! Bem-vindo à ViaLogistic!\n\nComo posso ajudar você hoje?"
        },
        "type": "start",
        "position": {"x": 400, "y": 0}
      },
      {
        "id": "menu-1",
        "data": {
          "label": "Menu Principal",
          "options": ["1️⃣ Abrir Chamado", "2️⃣ Falar com Atendente", "3️⃣ Consultar Chamado", "4️⃣ FAQ / Dúvidas"],
          "question": "Escolha uma opção:"
        },
        "type": "question",
        "position": {"x": 400, "y": 120}
      },
      {
        "id": "chamado-inicio",
        "data": {
          "label": "Buscar Dados Chamado",
          "action": "Buscar último chamado e placas da API Google Sheets",
          "actionType": "api"
        },
        "type": "action",
        "position": {"x": 100, "y": 280}
      },
      {
        "id": "chamado-placa",
        "data": {
          "label": "Selecionar Placa",
          "options": ["Lista dinâmica de placas da API"],
          "question": "📋 Selecione uma placa:"
        },
        "type": "question",
        "position": {"x": 100, "y": 400}
      },
      {
        "id": "atendente-inicio",
        "data": {
          "label": "Transferir Atendente",
          "action": "Atualizar status da conversa para pending e aguardar atendente",
          "actionType": "transfer"
        },
        "type": "action",
        "position": {"x": 400, "y": 280}
      },
      {
        "id": "atendente-aguardando",
        "data": {
          "label": "Aguardando",
          "message": "👤 Aguarde um momento...\n\nEstou transferindo você para um atendente.\n\nDigite 0 para voltar ao menu."
        },
        "type": "message",
        "position": {"x": 400, "y": 400}
      }
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  flows = EXCLUDED.flows,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  updated_at = now();