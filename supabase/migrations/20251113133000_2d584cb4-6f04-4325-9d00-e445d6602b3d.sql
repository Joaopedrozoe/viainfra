-- Limpar telefones inválidos (números @lid que foram salvos incorretamente)
-- e preparar para receber os telefones corretos quando chegarem novos webhooks

-- Limpar telefones que claramente vieram de @lid e não são válidos
UPDATE contacts
SET phone = NULL, updated_at = now()
WHERE phone IS NOT NULL 
  AND phone != ''
  AND (
    -- Telefones que são claramente IDs do @lid
    phone ~ '^\d{13,15}$' AND NOT phone ~ '^55\d{10,11}$'
    OR
    -- Telefones específicos conhecidos de @lid
    phone IN ('37765664264440', '122007689646323', '253867547701289')
  );

-- Atualizar telefone da Joicy se ela tiver um registro antigo válido
-- (pegando do registro que já tem o telefone correto)
UPDATE contacts c1
SET phone = '5511991593841', updated_at = now()
WHERE c1.name = 'Joicy'
  AND (c1.phone IS NULL OR c1.phone = '' OR c1.phone = '11991593841')
  AND EXISTS (
    SELECT 1 FROM contacts c2 
    WHERE c2.name = 'Joicy' 
    AND c2.phone IN ('11991593841', '5511991593841')
  );