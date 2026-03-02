-- Backfill missing profiles for users that already have company_access to VIALOGISTIC
-- This fixes RLS visibility for inbox/conversations/messages in that company
INSERT INTO public.profiles (
  user_id,
  company_id,
  name,
  email,
  phone,
  avatar_url,
  role,
  permissions,
  created_at,
  updated_at
)
SELECT
  base.user_id,
  ca.company_id,
  base.name,
  base.email,
  base.phone,
  base.avatar_url,
  base.role,
  COALESCE(base.permissions, '[]'::jsonb),
  now(),
  now()
FROM public.company_access ca
JOIN LATERAL (
  SELECT p.*
  FROM public.profiles p
  WHERE p.user_id = ca.user_id
  ORDER BY p.created_at ASC
  LIMIT 1
) AS base ON true
LEFT JOIN public.profiles existing
  ON existing.user_id = ca.user_id
 AND existing.company_id = ca.company_id
WHERE ca.company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
  AND existing.id IS NULL;