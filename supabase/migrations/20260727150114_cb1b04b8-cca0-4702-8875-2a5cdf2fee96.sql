UPDATE public.whatsapp_instances
SET status = 'close', connection_state = 'close', updated_at = now()
WHERE instance_name = 'VIALOGISTICOFICIAL';

INSERT INTO public.whatsapp_instances (company_id, instance_name, status, connection_state, phone_number, updated_at)
SELECT id, 'VIALOGISTIC', 'open', 'open', NULL, now()
FROM public.companies WHERE name = 'VIALOGISTIC'
ON CONFLICT DO NOTHING;

UPDATE public.whatsapp_instances wi
SET company_id = c.id, status = 'open', connection_state = 'open', updated_at = now()
FROM public.companies c
WHERE c.name = 'VIALOGISTIC' AND wi.instance_name = 'VIALOGISTIC';