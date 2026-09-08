import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, serviceClient, processJob, analyzeConversation, tickBackfill, GeminiError } from '../_shared/vivi.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'queue';
    const supabase = serviceClient();

    if (mode === 'conversation') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Não autenticado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Não autenticado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { conversationId } = body;
      if (!conversationId) {
        return new Response(JSON.stringify({ error: 'conversationId obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: conversation } = await supabase
        .from('conversations')
        .select('id, company_id')
        .eq('id', conversationId)
        .maybeSingle();
      if (!conversation) {
        return new Response(JSON.stringify({ error: 'Conversa não encontrada' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      const { data: access } = await supabase
        .from('company_access')
        .select('company_id')
        .eq('user_id', userData.user.id)
        .eq('company_id', conversation.company_id)
        .maybeSingle();

      const hasAccess = profile?.company_id === conversation.company_id || !!access;
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: 'Sem acesso a esta empresa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: agent } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('company_id', conversation.company_id)
        .maybeSingle();
      if (!agent) {
        return new Response(JSON.stringify({ error: 'Agente Vivi não configurado para esta empresa' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: company } = await supabase.from('companies').select('name').eq('id', conversation.company_id).maybeSingle();

      try {
        const { insight, skipped } = await analyzeConversation(supabase, agent, company?.name || 'a empresa', conversationId);
        return new Response(JSON.stringify({ insight, skipped: !!skipped }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        if (err instanceof GeminiError && err.code === 'GEMINI_API_KEY_MISSING') {
          await supabase.from('ai_agents').update({ last_error: 'GEMINI_API_KEY não configurada' }).eq('id', agent.id);
          return new Response(JSON.stringify({ missingKey: true, error: 'GEMINI_API_KEY não configurada' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // mode 'queue' (default): called by pg_cron.
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);

    const { data: activeAgents } = await supabase.from('ai_agents').select('*').eq('status', 'active');
    const activeCompanyIds = (activeAgents || []).map((a: any) => a.company_id);

    if (activeCompanyIds.length === 0) {
      return new Response(JSON.stringify({ processed: 0, skipped: 0, errors: 0, missingKey: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: jobs } = await supabase
      .from('ai_learning_jobs')
      .select('*')
      .eq('status', 'pending')
      .in('company_id', activeCompanyIds)
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    let processed = 0;
    let skippedCount = 0;
    let errors = 0;
    let missingKey = false;

    const agentsCache = new Map<string, any>();
    const companiesCache = new Map<string, string>();
    const limitReachedCompanies = new Set<string>();

    for (const job of jobs || []) {
      if (limitReachedCompanies.has(job.company_id)) continue;
      const result = await processJob(supabase, job, agentsCache, companiesCache);
      if (result.status === 'done') processed++;
      else if (result.status === 'skipped') skippedCount++;
      else if (result.status === 'limit_reached') limitReachedCompanies.add(job.company_id);
      else if (result.status === 'error') {
        errors++;
        if ((result as any).missingKey) missingKey = true;
      }
    }

    // Feed backfill queues for agents that are running and low on pending jobs.
    for (const [companyId, agent] of agentsCache.entries()) {
      if (agent?.backfill_status === 'running') {
        const { count } = await supabase
          .from('ai_learning_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('job_type', 'backfill')
          .eq('status', 'pending');
        if ((count || 0) < 5) {
          await tickBackfill(supabase, agent.id, companyId);
        }
      }
    }

    return new Response(JSON.stringify({ processed, skipped: skippedCount, errors, missingKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('vivi-analyze-conversation error', err);
    return new Response(JSON.stringify({ processed: 0, skipped: 0, errors: 1, missingKey: false, error: err instanceof Error ? err.message : String(err) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
