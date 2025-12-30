
-- Buscar foto do grupo VIAINFRA-O.M MANUTENÇÃO diretamente usando o remoteJid
-- e atualizar o avatar_url com URL placeholder para forçar refresh na UI

-- Primeiro, resetar os avatares para NULL para forçar o frontend a não mostrar nada
-- O sync-profile-pictures vai buscar as fotos quando for executado

-- Para o grupo, vamos marcar como precisando de sync
UPDATE contacts 
SET avatar_url = NULL, 
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb), 
      '{needsAvatarSync}', 
      'true'::jsonb
    ),
    updated_at = now()
WHERE id = '50ca181f-4ca0-413c-84da-280275f960b2';

-- Para a Flávia Financeiro
UPDATE contacts 
SET avatar_url = NULL,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb), 
      '{needsAvatarSync}', 
      'true'::jsonb
    ),
    updated_at = now()
WHERE id = 'dc555fea-79ca-4fb9-94c5-483e1b1e9ee3';
