-- Criar tabela para armazenar bots e seus fluxos
CREATE TABLE IF NOT EXISTS public.bots (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  flows JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, id, version)
);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

-- Policy para visualizar bots da empresa
CREATE POLICY "Users can view bots from their company"
ON public.bots
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Policy para inserir bots na empresa
CREATE POLICY "Users can insert bots to their company"
ON public.bots
FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Policy para atualizar bots da empresa
CREATE POLICY "Users can update bots from their company"
ON public.bots
FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Policy para deletar bots da empresa
CREATE POLICY "Users can delete bots from their company"
ON public.bots
FOR DELETE
USING (company_id IN (
  SELECT company_id FROM profiles WHERE user_id = auth.uid()
));

-- Permitir service role gerenciar bots (para webhooks)
CREATE POLICY "Allow service role to manage bots"
ON public.bots
FOR ALL
USING (true)
WITH CHECK (true);

-- Inserir o bot FLUXO-VIAINFRA para a empresa Viainfra
INSERT INTO public.bots (id, company_id, name, version, status, flows)
VALUES (
  'fluxo-viainfra',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'FLUXO-VIAINFRA',
  'v1',
  'published',
  '{
    "nodes": [
      {"id": "start-1", "type": "start", "position": {"x": 400, "y": 0}, "data": {"label": "Início", "message": "👋 Olá! Bem-vindo à Viainfra!\\n\\nComo posso ajudar você hoje?"}},
      {"id": "menu-1", "type": "question", "position": {"x": 400, "y": 120}, "data": {"label": "Menu Principal", "question": "Escolha uma opção:", "options": ["1️⃣ Abrir Chamado", "2️⃣ Falar com Atendente", "3️⃣ Consultar Chamado", "4️⃣ FAQ / Dúvidas"]}},
      {"id": "chamado-inicio", "type": "action", "position": {"x": 100, "y": 280}, "data": {"label": "Buscar Dados Chamado", "actionType": "api", "action": "Buscar último chamado e placas da API Google Sheets"}},
      {"id": "chamado-placa", "type": "question", "position": {"x": 100, "y": 400}, "data": {"label": "Selecionar Placa", "question": "📋 Selecione uma placa:", "options": ["Lista dinâmica de placas da API"]}},
      {"id": "atendente-inicio", "type": "action", "position": {"x": 400, "y": 280}, "data": {"label": "Transferir Atendente", "actionType": "transfer", "action": "Atualizar status da conversa para pending e aguardar atendente"}},
      {"id": "atendente-aguardando", "type": "message", "position": {"x": 400, "y": 400}, "data": {"label": "Aguardando", "message": "👤 Aguarde um momento...\\n\\nEstou transferindo você para um atendente.\\n\\nDigite 0 para voltar ao menu."}}
    ],
    "edges": [
      {"id": "e-start-menu", "source": "start-1", "target": "menu-1", "type": "smoothstep"},
      {"id": "e-menu-chamado", "source": "menu-1", "target": "chamado-inicio", "type": "smoothstep", "label": "1️⃣ Abrir Chamado"},
      {"id": "e-menu-atendente", "source": "menu-1", "target": "atendente-inicio", "type": "smoothstep", "label": "2️⃣ Falar com Atendente"}
    ]
  }'::jsonb
);