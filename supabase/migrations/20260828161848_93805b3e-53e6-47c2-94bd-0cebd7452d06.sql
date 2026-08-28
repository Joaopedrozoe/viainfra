update public.bots set status = 'draft', updated_at = now()
where id = 'bot-whatsapp-viainfra';

update public.bots b
set flows = replace(replace(v.flows::text, 'ViaLogistic', 'Viainfra'), 'VIALOGISTIC', 'VIAINFRA')::jsonb,
    status = 'published',
    channels = coalesce(v.channels, array['whatsapp']::text[]),
    updated_at = now()
from public.bots v
where b.id = 'fluxo-viainfra' and v.id = 'fluxo-vialogistic';