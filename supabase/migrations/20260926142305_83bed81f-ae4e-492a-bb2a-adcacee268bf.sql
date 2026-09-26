-- 1) Desligar a IA (cron + agentes)
SELECT cron.unschedule('vivi-process-queue');
UPDATE public.ai_agents SET status = 'paused', continuous_enabled = false, updated_at = now();
UPDATE public.ai_learning_jobs SET status = 'cancelled', updated_at = now() WHERE status IN ('pending','queued','running');
DROP TRIGGER IF EXISTS enqueue_ai_learning_job_trigger ON public.messages;

-- 2) Corrigir chamadas que conectaram mas ficaram como perdida/nao atendida
UPDATE public.calls
SET status = 'completed', updated_at = now()
WHERE connected_at IS NOT NULL
  AND duration > 0
  AND status IN ('no_answer','missed','rejected');

-- 3) Corrigir o registro na conversa dessas chamadas
UPDATE public.messages m
SET content = '📞 Chamada de voz · ' || to_char((c.duration / 60), 'FM999') || ':' || lpad((c.duration % 60)::text, 2, '0'),
    metadata = COALESCE(m.metadata, '{}'::jsonb) || jsonb_build_object('kind','call_log','call_status','completed','duration', c.duration)
FROM public.calls c
WHERE m.metadata->>'call_id' = c.wa_call_id
  AND c.status = 'completed'
  AND c.duration > 0
  AND COALESCE(m.metadata->>'call_status','') <> 'completed';