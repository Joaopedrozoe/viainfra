// Shared logic for Vivi (AI learning agent): analysis + backfill scheduling.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateJson, GeminiError } from './gemini.ts';
export { GeminiError };

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const INSIGHT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    sentiment: { type: 'string', enum: ['positivo', 'neutro', 'negativo'] },
    department: { type: 'string', enum: ['Atendimento', 'Comercial', 'Manutenção', 'Financeiro', 'RH', 'Outro'] },
    topics: { type: 'array', items: { type: 'string' } },
    contact_intent: { type: 'string' },
    unresolved_questions: { type: 'array', items: { type: 'string' } },
    service_gaps: { type: 'array', items: { type: 'string' } },
    suggested_quick_replies: { type: 'array', items: { type: 'string' } },
    suggested_template_ideas: { type: 'array', items: { type: 'string' } },
    opportunity: { type: 'string' },
    score: { type: 'number' },
  },
  required: ['title', 'summary', 'sentiment', 'department', 'topics', 'score'],
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function buildPrompt(companyName: string, agent: any, contactName: string, messages: { sender_type: string; content: string; created_at: string }[]) {
  const transcript = messages
    .map((m) => `[${m.created_at}] ${m.sender_type === 'contact' ? contactName : 'Atendente'}: ${m.content}`)
    .join('\n');

  return `Você é ${agent.name}, uma assistente de IA em modo aprendizado (apenas observa e analisa, nunca responde ao cliente) para a empresa ${companyName}.
Tom: ${agent.tone || 'profissional e cordial'}.
Personalidade: ${agent.personality || 'atenciosa e objetiva'}.

Analise a conversa de WhatsApp abaixo entre a empresa e o contato "${contactName}" e retorne um JSON com os campos solicitados no schema, em português (pt-BR). O campo "score" é a nota de 0 a 100 para a qualidade do atendimento prestado pela empresa nesta conversa.

Conversa:
${transcript}`;
}

async function enforceDailyLimit(supabase: SupabaseClient, agent: any): Promise<{ ok: boolean; agent: any }> {
  let dailyRequests = agent.daily_requests;
  let dailyRequestsDate = agent.daily_requests_date;
  const today = todayStr();
  if (dailyRequestsDate !== today) {
    dailyRequests = 0;
    dailyRequestsDate = today;
    await supabase.from('ai_agents').update({ daily_requests: 0, daily_requests_date: today }).eq('id', agent.id);
    agent = { ...agent, daily_requests: 0, daily_requests_date: today };
  }
  if (dailyRequests >= agent.daily_request_limit) {
    await supabase.from('ai_agents').update({ last_error: 'Limite diário do Gemini atingido' }).eq('id', agent.id);
    return { ok: false, agent };
  }
  return { ok: true, agent };
}

export async function analyzeConversation(
  supabase: SupabaseClient,
  agent: any,
  companyName: string,
  conversationId: string,
): Promise<{ insight: any; skipped?: boolean }> {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, contact_id, company_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (!conversation) throw new Error('Conversa não encontrada');

  const { data: contact } = await supabase
    .from('contacts')
    .select('name')
    .eq('id', conversation.contact_id)
    .maybeSingle();

  const { data: existingInsight } = await supabase
    .from('ai_insights')
    .select('id, analyzed_until, source_message_count')
    .eq('conversation_id', conversationId)
    .eq('insight_type', 'conversation')
    .maybeSingle();

  let query = supabase
    .from('messages')
    .select('id, content, sender_type, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(60);

  if (existingInsight?.analyzed_until) {
    query = query.gt('created_at', existingInsight.analyzed_until);
  }

  const { data: messagesDesc } = await query;
  const newMessages = (messagesDesc || []).slice().reverse();

  if (newMessages.length < 2) {
    return { insight: null, skipped: true };
  }

  const prompt = buildPrompt(companyName, agent, contact?.name || 'Contato', newMessages);
  const model = (agent.config && (agent.config as any).model) || undefined;

  const result = await generateJson<any>({ prompt, responseSchema: INSIGHT_SCHEMA, model });

  const lastMessage = newMessages[newMessages.length - 1];
  const sourceCount = (existingInsight?.source_message_count || 0) + newMessages.length;

  const insightPayload: any = {
    company_id: conversation.company_id,
    agent_id: agent.id,
    conversation_id: conversationId,
    insight_type: 'conversation',
    title: result.title,
    summary: result.summary,
    sentiment: result.sentiment,
    department: result.department,
    topics: result.topics || [],
    score: result.score ?? null,
    data: result,
    source_message_count: sourceCount,
    analyzed_until: lastMessage.created_at,
    updated_at: new Date().toISOString(),
  };

  let insight;
  if (existingInsight) {
    const { data } = await supabase
      .from('ai_insights')
      .update(insightPayload)
      .eq('id', existingInsight.id)
      .select()
      .single();
    insight = data;
  } else {
    const { data } = await supabase.from('ai_insights').insert(insightPayload).select().single();
    insight = data;
  }

  await supabase
    .from('ai_agents')
    .update({
      daily_requests: (agent.daily_requests || 0) + 1,
      last_run_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', agent.id);

  return { insight };
}

export async function processJob(supabase: SupabaseClient, job: any, agentsCache: Map<string, any>, companiesCache: Map<string, string>) {
  await supabase.from('ai_learning_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', job.id);

  let agent = agentsCache.get(job.company_id);
  if (!agent) {
    const { data } = await supabase.from('ai_agents').select('*').eq('company_id', job.company_id).maybeSingle();
    agent = data;
    if (agent) agentsCache.set(job.company_id, agent);
  }

  if (!agent || agent.status !== 'active') {
    await supabase.from('ai_learning_jobs').update({ status: 'skipped', finished_at: new Date().toISOString() }).eq('id', job.id);
    return { status: 'skipped' as const };
  }

  const limitCheck = await enforceDailyLimit(supabase, agent);
  agent = limitCheck.agent;
  agentsCache.set(job.company_id, agent);
  if (!limitCheck.ok) {
    // Leave job pending, stop processing this company for this run.
    return { status: 'limit_reached' as const };
  }

  let companyName = companiesCache.get(job.company_id);
  if (!companyName) {
    const { data } = await supabase.from('companies').select('name').eq('id', job.company_id).maybeSingle();
    companyName = data?.name || 'a empresa';
    companiesCache.set(job.company_id, companyName);
  }

  try {
    const { skipped } = await analyzeConversation(supabase, agent, companyName, job.conversation_id);
    if (skipped) {
      await supabase.from('ai_learning_jobs').update({ status: 'skipped', finished_at: new Date().toISOString() }).eq('id', job.id);
      return { status: 'skipped' as const };
    }
    await supabase.from('ai_learning_jobs').update({ status: 'done', finished_at: new Date().toISOString() }).eq('id', job.id);

    if (job.job_type === 'backfill') {
      const { data: freshAgent } = await supabase.from('ai_agents').select('backfill_processed').eq('id', agent.id).maybeSingle();
      await supabase
        .from('ai_agents')
        .update({ backfill_processed: (freshAgent?.backfill_processed || 0) + 1 })
        .eq('id', agent.id);
    }

    return { status: 'done' as const };
  } catch (err) {
    const attempts = (job.attempts || 0) + 1;
    const isMissingKey = err instanceof GeminiError && err.code === 'GEMINI_API_KEY_MISSING';
    const errorMessage = isMissingKey ? 'GEMINI_API_KEY não configurada' : (err instanceof Error ? err.message : String(err));

    if (isMissingKey) {
      await supabase.from('ai_agents').update({ last_error: errorMessage }).eq('id', agent.id);
    } else {
      await supabase.from('ai_agents').update({ last_error: errorMessage }).eq('id', agent.id);
    }

    await supabase
      .from('ai_learning_jobs')
      .update({
        status: attempts >= 3 ? 'error' : 'pending',
        attempts,
        error: errorMessage,
        finished_at: attempts >= 3 ? new Date().toISOString() : null,
      })
      .eq('id', job.id);

    return { status: 'error' as const, missingKey: isMissingKey, error: errorMessage };
  }
}

export async function tickBackfill(supabase: SupabaseClient, agentId: string, companyId: string) {
  const { data: agent } = await supabase.from('ai_agents').select('*').eq('id', agentId).maybeSingle();
  if (!agent || agent.backfill_status !== 'running') return;

  let convQuery = supabase
    .from('conversations')
    .select('id, updated_at')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: true })
    .limit(30);

  if (agent.backfill_cursor) {
    convQuery = convQuery.gt('updated_at', agent.backfill_cursor);
  }

  const { data: conversations } = await convQuery;

  if (!conversations || conversations.length === 0) {
    await supabase.from('ai_agents').update({ backfill_status: 'done' }).eq('id', agentId);
    return;
  }

  for (const conv of conversations) {
    const { data: existingPending } = await supabase
      .from('ai_learning_jobs')
      .select('id')
      .eq('conversation_id', conv.id)
      .eq('status', 'pending')
      .maybeSingle();
    if (existingPending) continue;
    await supabase.from('ai_learning_jobs').insert({
      company_id: companyId,
      agent_id: agentId,
      conversation_id: conv.id,
      job_type: 'backfill',
      status: 'pending',
    });
  }

  const newCursor = conversations[conversations.length - 1].updated_at;
  await supabase.from('ai_agents').update({ backfill_cursor: newCursor }).eq('id', agentId);
}
