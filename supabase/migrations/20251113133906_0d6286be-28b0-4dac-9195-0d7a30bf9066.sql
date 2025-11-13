-- Corrigir contatos com números de instância incorretos
-- Deletar contato duplicado da Joicy com número da instância
DELETE FROM contacts 
WHERE id = '7907bfe2-f734-4f08-87b6-6149df900427' 
AND phone = '5511940027215';

-- Limpar qualquer outro contato que tenha esse número de instância
UPDATE contacts 
SET phone = NULL, updated_at = now()
WHERE phone = '5511940027215' 
AND id != '7907bfe2-f734-4f08-87b6-6149df900427';

-- Garantir que o contato correto da Joicy está ativo
UPDATE contacts
SET updated_at = now()
WHERE id = 'cf4e8863-a2d2-4472-a006-25eb26a582ee'
AND name = 'Joicy'
AND phone = '5511991593841';