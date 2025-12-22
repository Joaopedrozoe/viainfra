
-- 1. Reabrir conversa do Yago para aparecer no inbox
UPDATE conversations 
SET status = 'open',
    updated_at = now()
WHERE id = '61f82363-6d0b-496e-ba6d-8dc39b60a570';
