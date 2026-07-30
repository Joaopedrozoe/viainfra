INSERT INTO public.profiles (user_id, company_id, name, email, role, permissions)
SELECT '813d3ebc-342b-47dc-8701-ac5c4a3016c4', 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0', p.name, p.email, p.role, p.permissions
FROM public.profiles p
WHERE p.user_id = '813d3ebc-342b-47dc-8701-ac5c4a3016c4' AND p.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND NOT EXISTS (SELECT 1 FROM public.profiles x WHERE x.user_id = '813d3ebc-342b-47dc-8701-ac5c4a3016c4' AND x.company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0');

INSERT INTO public.profiles (user_id, company_id, name, email, role, permissions)
SELECT '327c80f9-4052-47eb-bb99-d1e98de596ee', 'da17735c-5a76-4797-b338-f6e63a7b3f8b', p.name, p.email, p.role, p.permissions
FROM public.profiles p
WHERE p.user_id = '327c80f9-4052-47eb-bb99-d1e98de596ee' AND p.company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
AND NOT EXISTS (SELECT 1 FROM public.profiles x WHERE x.user_id = '327c80f9-4052-47eb-bb99-d1e98de596ee' AND x.company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b');

INSERT INTO public.company_access (user_id, company_id)
SELECT v.user_id, v.company_id FROM (VALUES
  ('813d3ebc-342b-47dc-8701-ac5c4a3016c4'::uuid,'da17735c-5a76-4797-b338-f6e63a7b3f8b'::uuid),
  ('813d3ebc-342b-47dc-8701-ac5c4a3016c4'::uuid,'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'::uuid),
  ('327c80f9-4052-47eb-bb99-d1e98de596ee'::uuid,'da17735c-5a76-4797-b338-f6e63a7b3f8b'::uuid),
  ('327c80f9-4052-47eb-bb99-d1e98de596ee'::uuid,'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'::uuid)
) AS v(user_id, company_id)
WHERE NOT EXISTS (SELECT 1 FROM public.company_access ca WHERE ca.user_id = v.user_id AND ca.company_id = v.company_id);