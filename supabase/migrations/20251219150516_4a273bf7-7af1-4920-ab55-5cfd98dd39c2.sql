
-- Renomear os grupos com os nomes corretos do WhatsApp
UPDATE contacts SET name = 'EIO 8021 OM336 26/11' WHERE id = 'cfbf98c1-8d75-487c-9de3-255f0f2ff8e6';
UPDATE contacts SET name = 'EDC 9A73 OM 335VI 26/11' WHERE id = '1049882b-e9b6-45ff-ae5f-39937c663cae';
UPDATE contacts SET name = 'EFU 4377 OM 334VI 19/11' WHERE id = 'ceb3bdaa-9e21-49db-81e0-736ddfc84049';

-- Agora corrigir TODOS os updated_at baseados na última mensagem real
UPDATE conversations c
SET updated_at = COALESCE(
  (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id),
  c.created_at
)
WHERE c.channel = 'whatsapp';
