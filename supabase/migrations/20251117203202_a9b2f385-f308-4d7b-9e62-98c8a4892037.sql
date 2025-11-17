-- Remover constraint UNIQUE de user_id e adicionar UNIQUE(user_id, company_id)
-- para permitir múltiplos perfis por usuário em diferentes empresas

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_key;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_company_id_key 
UNIQUE (user_id, company_id);

-- Criar perfil adicional para Elisabete na Viainfra
INSERT INTO profiles (user_id, company_id, name, email, role, permissions)
VALUES (
  'c961a406-ce57-48c0-a6e5-80e228d11a8b',
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'Elisabete Silva',
  'elisabete.silva@viainfra.com.br',
  'admin',
  '[]'::jsonb
)
ON CONFLICT (user_id, company_id) DO NOTHING;