-- Criar empresa VIALOGISTIC
INSERT INTO companies (name, plan, domain, logo_url, settings)
VALUES ('VIALOGISTIC', 'free', NULL, NULL, '{}'::jsonb);

-- Atualizar perfil da Elisabete para acessar VIALOGISTIC
UPDATE profiles
SET company_id = (SELECT id FROM companies WHERE name = 'VIALOGISTIC'),
    updated_at = now()
WHERE user_id = 'c961a406-ce57-48c0-a6e5-80e228d11a8b';