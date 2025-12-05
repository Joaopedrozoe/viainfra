
-- 1. LIMPAR CONVERSAS ÓRFÃS (sem mensagens e contatos duplicados)
-- Primeiro identificar e deletar conversas vazias duplicadas
DELETE FROM conversations 
WHERE id IN (
  SELECT c.id
  FROM conversations c
  JOIN contacts ct ON c.contact_id = ct.id
  WHERE c.channel = 'whatsapp'
    AND ct.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
    AND (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) = 0
    AND ct.phone IN (
      SELECT phone FROM contacts 
      WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
        AND phone IS NOT NULL
      GROUP BY phone HAVING COUNT(*) > 1
    )
);

-- 2. CONSOLIDAR CONTATOS DUPLICADOS
-- Manter o contato que tem a conversa com mais mensagens
WITH contact_scores AS (
  SELECT 
    ct.id as contact_id,
    ct.phone,
    ct.name,
    ct.avatar_url,
    COALESCE((
      SELECT MAX(msg_count) 
      FROM (
        SELECT c.id, COUNT(m.id) as msg_count
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.contact_id = ct.id
        GROUP BY c.id
      ) sub
    ), 0) as max_msgs,
    ROW_NUMBER() OVER (
      PARTITION BY ct.phone 
      ORDER BY 
        COALESCE((
          SELECT MAX(msg_count) 
          FROM (
            SELECT c.id, COUNT(m.id) as msg_count
            FROM conversations c
            LEFT JOIN messages m ON m.conversation_id = c.id
            WHERE c.contact_id = ct.id
            GROUP BY c.id
          ) sub
        ), 0) DESC,
        ct.avatar_url IS NOT NULL DESC,
        ct.created_at ASC
    ) as rn
  FROM contacts ct
  WHERE ct.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
    AND ct.phone IS NOT NULL
    AND ct.phone IN (
      SELECT phone FROM contacts 
      WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
        AND phone IS NOT NULL
      GROUP BY phone HAVING COUNT(*) > 1
    )
),
-- Identificar quais manter (rn=1) e quais deletar (rn>1)
contacts_to_delete AS (
  SELECT contact_id FROM contact_scores WHERE rn > 1
)
-- Deletar conversas dos contatos duplicados
DELETE FROM conversations WHERE contact_id IN (SELECT contact_id FROM contacts_to_delete);

-- 3. DELETAR CONTATOS DUPLICADOS (mantendo o com mais mensagens/avatar)
WITH contact_scores AS (
  SELECT 
    ct.id as contact_id,
    ct.phone,
    ROW_NUMBER() OVER (
      PARTITION BY ct.phone 
      ORDER BY 
        COALESCE((
          SELECT COUNT(*) FROM messages m 
          JOIN conversations c ON c.id = m.conversation_id 
          WHERE c.contact_id = ct.id
        ), 0) DESC,
        ct.avatar_url IS NOT NULL DESC,
        ct.created_at ASC
    ) as rn
  FROM contacts ct
  WHERE ct.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
    AND ct.phone IS NOT NULL
    AND ct.phone IN (
      SELECT phone FROM contacts 
      WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b' 
        AND phone IS NOT NULL
      GROUP BY phone HAVING COUNT(*) > 1
    )
)
DELETE FROM contacts WHERE id IN (
  SELECT contact_id FROM contact_scores WHERE rn > 1
);

-- 4. CRIAR ÍNDICE ÚNICO PARA PREVENIR DUPLICATAS FUTURAS
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_contact_phone_per_company 
ON contacts (company_id, phone) 
WHERE phone IS NOT NULL AND phone != '';
