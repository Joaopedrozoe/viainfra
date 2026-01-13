
-- CORREÇÃO: Mesclar conversa duplicada do Julio Lopes
-- Conversa original: 414436cf-610c-495d-bfd1-2639c837d96d
-- Conversa duplicada: 343079aa-65f6-4744-8db5-d3f11268265a (tem "Km 152032")

-- 1. Mover mensagens da conversa duplicada para a original
UPDATE messages
SET conversation_id = '414436cf-610c-495d-bfd1-2639c837d96d'
WHERE conversation_id = '343079aa-65f6-4744-8db5-d3f11268265a';

-- 2. Deletar a conversa duplicada
DELETE FROM conversations WHERE id = '343079aa-65f6-4744-8db5-d3f11268265a';

-- 3. Deletar o contato duplicado (b4a7fb4d-bd8e-4cfb-8dda-48bf8612d610)
DELETE FROM contacts WHERE id = 'b4a7fb4d-bd8e-4cfb-8dda-48bf8612d610';

-- 4. Atualizar timestamp da conversa original
UPDATE conversations 
SET updated_at = NOW()
WHERE id = '414436cf-610c-495d-bfd1-2639c837d96d';
