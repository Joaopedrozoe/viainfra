
-- 1. Update Eliane's profile to VIALOGISTIC
UPDATE profiles 
SET company_id = 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0'
WHERE user_id = '37e1dbad-832c-4d5a-918e-e5a4d20b3568';

-- 2. Remove any existing company_access for Eliane
DELETE FROM company_access 
WHERE user_id = '37e1dbad-832c-4d5a-918e-e5a4d20b3568';

-- 3. Add company_access ONLY for VIALOGISTIC
INSERT INTO company_access (user_id, company_id)
VALUES ('37e1dbad-832c-4d5a-918e-e5a4d20b3568', 'e3ad9c68-cf12-4e39-a12d-3f3068e975a0')
ON CONFLICT DO NOTHING;
