
-- Mover mensagens da conversa @lid errada para a conversa correta do Yago
-- Conversa errada: 156f6af1-5502-4a84-9b5e-4b1b0a82bdf7 (com E A Claro como contato, mas mensagens são do Yago)
-- Conversa correta: 61f82363-6d0b-496e-ba6d-8dc39b60a570 (Yago M Sam)

-- 1. Mover todas as mensagens para a conversa correta
UPDATE messages 
SET conversation_id = '61f82363-6d0b-496e-ba6d-8dc39b60a570'
WHERE conversation_id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7';

-- 2. Arquivar a conversa @lid errada para não aparecer mais no inbox
UPDATE conversations 
SET archived = true,
    status = 'resolved',
    updated_at = now()
WHERE id = '156f6af1-5502-4a84-9b5e-4b1b0a82bdf7';

-- 3. Atualizar o metadata da conversa correta com o lidJid para futuras mensagens @lid
UPDATE conversations 
SET metadata = metadata || jsonb_build_object('lidJid', '178576603263132'),
    updated_at = now()
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';
