
-- Step 1: Delete invalid contacts with cmh... or other invalid phone patterns
DELETE FROM public.contacts 
WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%viainfra%')
AND (
  phone ~ '^cm[a-z0-9]+$'  -- cmh..., cmid..., cmij..., etc.
  OR phone IS NULL
  OR phone = ''
  OR phone !~ '^\d{8,15}$'
);

-- Step 2: Delete duplicate conversations - keep only the one with most messages for each contact+channel
WITH ranked_conversations AS (
  SELECT 
    c.id,
    c.contact_id,
    c.channel,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as msg_count,
    c.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY c.contact_id, c.channel 
      ORDER BY 
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) DESC,
        c.updated_at DESC
    ) as rn
  FROM conversations c
  WHERE c.company_id IN (SELECT id FROM companies WHERE name ILIKE '%viainfra%')
  AND c.channel = 'whatsapp'
)
DELETE FROM public.conversations 
WHERE id IN (
  SELECT id FROM ranked_conversations WHERE rn > 1
);

-- Step 3: Clean up orphaned messages (from deleted conversations)
DELETE FROM public.messages 
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- Step 4: Merge duplicate contacts by phone (keep the one with avatar)
WITH duplicate_contacts AS (
  SELECT 
    phone,
    array_agg(id ORDER BY CASE WHEN avatar_url IS NOT NULL THEN 0 ELSE 1 END, created_at) as contact_ids
  FROM contacts
  WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%viainfra%')
  AND phone IS NOT NULL AND phone != ''
  GROUP BY phone
  HAVING COUNT(*) > 1
),
contacts_to_delete AS (
  SELECT unnest(contact_ids[2:]) as id FROM duplicate_contacts
)
-- Update conversations to point to the primary contact before deleting duplicates
UPDATE conversations 
SET contact_id = (
  SELECT contact_ids[1] FROM duplicate_contacts dc 
  WHERE dc.phone = (SELECT phone FROM contacts WHERE contacts.id = conversations.contact_id)
)
WHERE contact_id IN (SELECT id FROM contacts_to_delete);

-- Now delete the duplicate contacts
DELETE FROM public.contacts 
WHERE id IN (
  SELECT unnest(contact_ids[2:]) as id 
  FROM (
    SELECT 
      phone,
      array_agg(id ORDER BY CASE WHEN avatar_url IS NOT NULL THEN 0 ELSE 1 END, created_at) as contact_ids
    FROM contacts
    WHERE company_id IN (SELECT id FROM companies WHERE name ILIKE '%viainfra%')
    AND phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) as dups
);
