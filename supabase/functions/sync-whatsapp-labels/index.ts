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

      // 2. Fetch chats (each chat has labels array of ids)
      let chats: any[] = [];
      const chatsRes = await evo(`/chat/findChats/${instanceName}`, { method: 'POST', body: JSON.stringify({}) });
      if (Array.isArray(chatsRes.data)) chats = chatsRes.data;
      else if (Array.isArray(chatsRes.data?.chats)) chats = chatsRes.data.chats;

      let updated = 0;
      let skipped = 0;

      // 3. Update conversations
      for (const chat of chats) {
        const remoteJid: string | undefined =
          chat.remoteJid || chat.id || chat.jid || chat.chatId;
        if (!remoteJid) { skipped++; continue; }
        const chatLabelIds: string[] = (chat.labels || chat.labelIds || []).map((x: any) => String(x?.id ?? x));
        const resolved = chatLabelIds
          .map((id) => labelMap.get(id))
          .filter(Boolean);

        if (!resolved.length && !chatLabelIds.length) continue;

        // Find conversation by company + remoteJid
        const { data: convs } = await supabase
          .from('conversations')
          .select('id, metadata')
          .eq('company_id', inst.company_id)
          .filter('metadata->>remoteJid', 'eq', remoteJid)
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
        chats: chats.length,
        conversationsUpdated: updated,
        skipped,
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
