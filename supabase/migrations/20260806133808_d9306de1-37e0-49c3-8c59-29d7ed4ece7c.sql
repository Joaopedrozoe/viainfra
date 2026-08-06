
create or replace function public.call_log_label(_status text, _duration int)
returns text language sql immutable as $$
  select case
    when _status = 'completed' then '📞 Chamada de voz · ' || (coalesce(_duration,0)/60)::text || ':' || lpad((coalesce(_duration,0)%60)::text, 2, '0')
    when _status = 'missed' then '📞 Chamada de voz perdida'
    when _status = 'declined' or _status = 'rejected' then '📞 Chamada recusada'
    when _status = 'failed' then '📞 Chamada não completada'
    else '📞 Chamada não atendida'
  end
$$;

-- 1) Mensagem "não suportada" que chega DEPOIS do evento de chamada
create or replace function public.reconcile_unsupported_with_call()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if new.content is null or new.content not ilike '%não suportada%' or new.conversation_id is null then
    return new;
  end if;
  select * into c from public.calls
   where conversation_id = new.conversation_id
     and started_at between new.created_at - interval '3 minutes' and new.created_at + interval '3 minutes'
   order by abs(extract(epoch from (coalesce(ended_at, started_at) - new.created_at)))
   limit 1;
  if c.id is not null then
    new.content := public.call_log_label(c.status, c.duration);
    new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
      'kind','call_log','call_id', c.wa_call_id, 'call_status', c.status,
      'direction', c.direction, 'duration', c.duration);
  end if;
  return new;
end $$;

drop trigger if exists trg_reconcile_unsupported_with_call on public.messages;
create trigger trg_reconcile_unsupported_with_call
before insert on public.messages
for each row execute function public.reconcile_unsupported_with_call();

-- 2) Evento de chamada que chega DEPOIS da mensagem "não suportada"
create or replace function public.reconcile_call_into_messages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.conversation_id is null then return new; end if;
  update public.messages m
     set content = public.call_log_label(new.status, new.duration),
         metadata = coalesce(m.metadata,'{}'::jsonb) || jsonb_build_object(
           'kind','call_log','call_id', new.wa_call_id, 'call_status', new.status,
           'direction', new.direction, 'duration', new.duration)
   where m.conversation_id = new.conversation_id
     and m.content ilike '%não suportada%'
     and m.created_at between new.started_at - interval '3 minutes'
                          and coalesce(new.ended_at, new.started_at) + interval '3 minutes';
  return new;
end $$;

drop trigger if exists trg_reconcile_call_into_messages on public.calls;
create trigger trg_reconcile_call_into_messages
after insert or update of status, duration, ended_at on public.calls
for each row execute function public.reconcile_call_into_messages();

-- 3) Backfill do histórico
update public.messages m
   set content = public.call_log_label(c.status, c.duration),
       metadata = coalesce(m.metadata,'{}'::jsonb) || jsonb_build_object(
         'kind','call_log','call_id', c.wa_call_id, 'call_status', c.status,
         'direction', c.direction, 'duration', c.duration)
  from public.calls c
 where m.conversation_id = c.conversation_id
   and m.content ilike '%não suportada%'
   and m.created_at between c.started_at - interval '3 minutes'
                        and coalesce(c.ended_at, c.started_at) + interval '3 minutes';
