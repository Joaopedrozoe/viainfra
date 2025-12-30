
-- Limpar avatar do grupo VIAINFRA-O.M MANUTENÇÃO (URL expirada do WhatsApp)
UPDATE contacts 
SET avatar_url = NULL, updated_at = now()
WHERE id = '50ca181f-4ca0-413c-84da-280275f960b2';

-- Limpar avatar da Flávia Financeiro para forçar re-download
UPDATE contacts 
SET avatar_url = NULL, updated_at = now()
WHERE id = 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3';
