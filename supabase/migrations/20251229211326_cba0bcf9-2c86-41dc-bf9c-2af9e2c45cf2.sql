
-- ============================================================
-- CORREÇÃO: Mover mensagens Via Infra para Elisabete e limpar
-- ============================================================

-- 1. Mover as mensagens da Via Infra (59090260762729@lid) para a conversa da Elisabete
UPDATE messages 
SET conversation_id = 'cc8fff1b-c80e-4e9b-8b27-7266e49ad54d'
WHERE conversation_id = 'bc882d99-7782-47df-ad03-50bef7a2d561';

-- 2. Adicionar LID à conversa da Elisabete
UPDATE conversations 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{lidJid}', '"59090260762729@lid"'
  ),
  updated_at = now()
WHERE id = 'cc8fff1b-c80e-4e9b-8b27-7266e49ad54d';

-- 3. Deletar mapeamento LID existente (se houver) e inserir novo
DELETE FROM lid_phone_mapping WHERE lid = '59090260762729';
INSERT INTO lid_phone_mapping (lid, phone, contact_id, company_id, instance_name)
VALUES ('59090260762729', '5511999188607', '12eb5c34-edb7-4eb1-8cb2-dfc79f158669', 'da17735c-5a76-4797-b338-f6e63a7b3f8b', 'viainfra');

-- 4. Deletar a conversa Via Infra vazia
DELETE FROM conversations WHERE id = 'bc882d99-7782-47df-ad03-50bef7a2d561';

-- 5. Deletar contato Via Infra órfão (77755393-f1d5-4259-904a-6166e1b0eb13)
DELETE FROM contacts WHERE id = '77755393-f1d5-4259-904a-6166e1b0eb13';

-- 6. Garantir que a conversa do Yago (551120854990) está visível
UPDATE conversations 
SET 
  status = 'open',
  archived = false,
  updated_at = now()
WHERE id = 'fd52c009-c3f6-4933-8e06-92bc10dc0e32';
