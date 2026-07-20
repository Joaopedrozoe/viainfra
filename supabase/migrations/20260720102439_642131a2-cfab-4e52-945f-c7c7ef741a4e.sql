
INSERT INTO public.whatsapp_instances (company_id, instance_name, status, webhook_url, connection_state, updated_at)
VALUES (
  'da17735c-5a76-4797-b338-f6e63a7b3f8b',
  'VIAINFRA',
  'open',
  'https://xxojpfhnkxpbznbmhmua.supabase.co/functions/v1/evolution-webhook',
  'open',
  now()
)
ON CONFLICT (instance_name) DO UPDATE
SET company_id = EXCLUDED.company_id,
    status = 'open',
    webhook_url = EXCLUDED.webhook_url,
    connection_state = 'open',
    updated_at = now();

-- Desativar a instância antiga para não confundir sync/UI
UPDATE public.whatsapp_instances
SET status = 'close', connection_state = 'close', updated_at = now()
WHERE instance_name = 'VIAINFRAOFICIAL';
