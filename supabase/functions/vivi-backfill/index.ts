import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, serviceClient, tickBackfill } from '../_shared/vivi.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { companyId, action } = await req.json();
    if (!companyId || !action) {
      return new Response(JSON.stringify({ error: 'companyId e action são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = serviceClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    const { data: access } = await supabase
      .from('company_access')
      .select('company_id')
      .eq('user_id', userData.user.id)
      .eq('company_id', companyId)
      .maybeSingle();

    const hasAccess = profile?.company_id === companyId || !!access;
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Sem acesso a esta empresa' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: agent } = await supabase.from('ai_agents').select('*').eq('company_id', companyId).maybeSingle();
    if (!agent) {
      return new Response(JSON.stringify({ error: 'Agente Vivi não configurado para esta empresa' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'start') {
      const { count } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Filter conversations with >= 2 messages requires a join; approximate via count then refine.
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('company_id', companyId);

      let total = 0;
      if (conversations && conversations.length > 0) {
        const ids = conversations.map((c: any) => c.id);
        const { data: msgCounts } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', ids);
        const countsByConv = new Map<string, number>();
        for (const m of msgCounts || []) {
          countsByConv.set(m.conversation_id, (countsByConv.get(m.conversation_id) || 0) + 1);
        }
        total = Array.from(countsByConv.values()).filter((c) => c >= 2).length;
      }

      await supabase
        .from('ai_agents')
        .update({
          backfill_status: 'running',
          backfill_total: total,
          backfill_processed: 0,
          backfill_cursor: null,
        })
        .eq('id', agent.id);

      await tickBackfill(supabase, agent.id, companyId);

      return new Response(JSON.stringify({ ok: true, total }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'tick') {
      await tickBackfill(supabase, agent.id, companyId);
      const { data: updated } = await supabase.from('ai_agents').select('*').eq('id', agent.id).maybeSingle();
      return new Response(JSON.stringify({ ok: true, agent: updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'pause') {
      await supabase.from('ai_agents').update({ backfill_status: 'paused' }).eq('id', agent.id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'resume') {
      await supabase.from('ai_agents').update({ backfill_status: 'running' }).eq('id', agent.id);
      await tickBackfill(supabase, agent.id, companyId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset') {
      await supabase
        .from('ai_agents')
        .update({ backfill_status: 'idle', backfill_processed: 0, backfill_cursor: null })
        .eq('id', agent.id);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'action inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('vivi-backfill error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
