// Sync WhatsApp labels (etiquetas) from Evolution API into conversations.metadata.labels
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EVOLUTION_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';

async function evo(path: string, init: RequestInit = {}) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...init,
    headers: {
      apikey: EVOLUTION_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, data: json };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body.companyId;
    const discoverOnly: boolean = !!body.discover;

    // Resolver instância
    const { data: instances, error: instErr } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, company_id, status')
      .eq(companyId ? 'company_id' : 'status', companyId || 'open');

    if (instErr) throw instErr;
    const targets = (instances || []).filter((i: any) =>
      companyId ? i.company_id === companyId : true
    );

    const report: any[] = [];

    for (const inst of targets) {
      const instanceName = inst.instance_name;
      // 1. Fetch labels list
      const labelsRes = await evo(`/label/findLabels/${instanceName}`);
      const labels: any[] = Array.isArray(labelsRes.data) ? labelsRes.data : (labelsRes.data?.labels || []);
      const labelMap = new Map<string, { id: string; name: string; color: any }>();
      for (const l of labels) {
        const id = String(l.id ?? l.labelId ?? l.value ?? '');
        if (!id) continue;
        labelMap.set(id, {
          id,
          name: l.name || l.label || `Etiqueta ${id}`,
          color: l.color ?? l.colorId ?? null,
        });
      }

      // 2. Build jid -> labels[] map by asking Evolution which chats belong to each label
      const jidToLabels = new Map<string, Array<{ id: string; name: string; color: any }>>();
      const debugSamples: any[] = [];

      const extractJid = (item: any): string | null => {
        if (!item) return null;
        if (typeof item === 'string') return item.includes('@') ? item : null;
        return item.remoteJid || item.id || item.jid || item.chatId || null;
      };

      
      const labelEntries = Array.from(labelMap.entries());
      let workingAttempt: ((id: string) => { path: string; method: 'GET' | 'POST'; body?: string }) | null = null;
      const attemptBuilders = [
        (id: string) => ({ path: `/label/findChats/${instanceName}?labelId=${encodeURIComponent(id)}`, method: 'GET' as const }),
        (id: string) => ({ path: `/label/findChats/${instanceName}`, method: 'POST' as const, body: JSON.stringify({ labelId: id }) }),
        (id: string) => ({ path: `/chat/findChats/${instanceName}`, method: 'POST' as const, body: JSON.stringify({ where: { labels: { has: id } } }) }),
      ];
      const labelsToScan = discoverOnly ? labelEntries.slice(0, 3) : labelEntries;
      const attemptLog: any[] = [];
      for (const [labelId, label] of labelsToScan) {
        if (workingAttempt) {
          const a = workingAttempt(labelId);
          const r = await evo(a.path, { method: a.method, body: a.body });
          const arr = Array.isArray(r.data) ? r.data : (r.data?.chats || r.data?.data || []);
          if (Array.isArray(arr)) items = arr;
        } else {
          for (const build of attemptBuilders) {
            const a = build(labelId);
            const r = await evo(a.path, { method: a.method, body: a.body });
            if (!r.ok) continue;
            const arr = Array.isArray(r.data) ? r.data : (r.data?.chats || r.data?.data || []);
            if (Array.isArray(arr)) {
              items = arr;
              if (arr.length) { workingAttempt = build; break; }
            }
          }
        }
        if (debugSamples.length < 3 && items[0]) debugSamples.push({ labelId, sample: items[0] });
        for (const it of items) {
          const jid = extractJid(it);
          if (!jid) continue;
          const arr = jidToLabels.get(jid) || [];
          if (!arr.find((l) => l.id === label.id)) arr.push(label);
          jidToLabels.set(jid, arr);
        }
      }

      // Fallback: also try /chat/findChats to inspect if labels come embedded
      if (jidToLabels.size === 0) {
        const chatsRes = await evo(`/chat/findChats/${instanceName}`, { method: 'POST', body: JSON.stringify({}) });
        const chats = Array.isArray(chatsRes.data) ? chatsRes.data : (chatsRes.data?.chats || []);
        for (const chat of chats) {
          const jid = extractJid(chat);
          const ids: string[] = (chat.labels || chat.labelIds || []).map((x: any) => String(x?.id ?? x));
          if (!jid || !ids.length) continue;
          const arr = ids.map((id) => labelMap.get(id)).filter(Boolean) as any[];
          if (arr.length) jidToLabels.set(jid, arr);
        }
        if (debugSamples.length < 2 && chats[0]) debugSamples.push({ fallback: true, sample: chats[0] });
      }

      let updated = 0;

      // 3. Update conversations for each jid with labels
      for (const [jid, resolved] of jidToLabels.entries()) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('company_id', inst.company_id)
          .filter('metadata->>remoteJid', 'eq', jid)
          .limit(5);
        for (const conv of convs || []) {
          const meta = { ...(conv.metadata || {}), labels: resolved };
          const { error: upErr } = await supabase
            .from('conversations')
            .update({ metadata: meta })
            .eq('id', conv.id);
          if (!upErr) updated++;
        }
      }

      report.push({
        instance: instanceName,
        company_id: inst.company_id,
        labels: labels.length,
        jidsWithLabels: jidToLabels.size,
        conversationsUpdated: updated,
        debugSamples,
      });
    }

    return new Response(JSON.stringify({ ok: true, report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('sync-whatsapp-labels error', e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
