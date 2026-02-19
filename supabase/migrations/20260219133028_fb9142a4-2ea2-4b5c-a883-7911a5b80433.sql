
-- Fix contacts incorrectly named "Via Infra" using business profile info from Evolution API
-- 551132571212 → Seta Tech / Grupo Seta (business: setaconsultoria.com.br, suporte@setatech.com.br)
UPDATE public.contacts SET name = 'Seta Tech', updated_at = now() 
WHERE id = '77cac680-4f8d-4c98-bec6-aa60bd8faac1' AND name = 'Via Infra';

-- 5511933652410 → Dutra Mangueiras (business: dutramangueiras@hotmail.com, dutramangueiras.com.br)
UPDATE public.contacts SET name = 'Dutra Mangueiras', updated_at = now()
WHERE id = '5fc32d9d-6c7f-4281-9216-4c4cae1fa906' AND name = 'Via Infra';

-- 5511913533072 → Contato pessoal sem nome no WhatsApp, usar número formatado
UPDATE public.contacts SET name = 'Contato 5511913533072', updated_at = now()
WHERE id = 'e3df3111-b4e4-4fa9-9574-73734d30ca24' AND name = 'Via Infra';

-- 5511993782752 → Contato pessoal sem nome no WhatsApp, usar número formatado  
UPDATE public.contacts SET name = 'Contato 5511993782752', updated_at = now()
WHERE id = '16240378-5d9c-4c2e-a3aa-9bd5f9f63833' AND name = 'Via Infra';
