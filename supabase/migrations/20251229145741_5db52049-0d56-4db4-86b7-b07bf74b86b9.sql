
-- CORREÇÃO ESPECÍFICA: Atualizar updated_at da conversa Via Logistic (+55 11 91875-2320)
-- para refletir corretamente a última mensagem

UPDATE conversations 
SET updated_at = (
  SELECT created_at 
  FROM messages 
  WHERE conversation_id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a' 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a';

-- Também corrigir o nome do contato: WhatsApp mostra "Joicy Souza", banco mostra "Via Logistic"
-- Verificar se o pushName está correto no metadata e se devemos atualizar
-- Por ora, manter o nome atual pois pode ter sido personalizado pelo usuário
