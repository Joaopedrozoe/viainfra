import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * recover-contact-phones
 *
 * Recupera o telefone de contatos que ficaram sem número (ex.: importados de
 * backup, onde o arquivo não traz o JID). Fontes, em ordem de confiança:
 *   1. remoteJid oficial gravado no contato/conversa (@s.whatsapp.net / @c.us)
 *   2. mapeamento LID -> telefone (lid_phone_mapping)
 *   3. lista de contatos/chats da instância na Evolution (API oficial),
 *      casando pelo nome normalizado quando o match é único
 *
 * Sempre idempotente e seguro: nunca envia mensagem, nunca sobrescreve telefone
 * existente e nunca aplica match ambíguo. dryRun=true por padrão.
 */

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') ?? '';
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.length >= 10 && d.length <= 11) d = `55${d}`;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

function normalizeName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function phoneFromJid(jid: string | null | undefined): string | null {
  if (!jid) return null;
  if (jid.endsWith('@g.us')) return null;
  const local = jid.split('@')[0];
  if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@c.us')) {
    return normalizePhone(local);
  }
  return null;
}

function lidFromJid(jid: string | null | undefined): string | null {
  if (!jid || !jid.includes('@lid')) return null;
  return jid.split('@')[0] || null;
}

async function evolutionPost(path: string, body: unknown) {
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);
    const userId = userData.user.id;

    let payload: { companyId?: string; dryRun?: boolean; limit?: number } = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const dryRun = payload.dryRun !== false;
    const limit = Math.min(Math.max(payload.limit ?? 2000, 1), 5000);

    // Empresas às quais o usuário tem acesso
    const [{ data: profiles }, { data: access }] = await Promise.all([
      admin.from('profiles').select('company_id').eq('user_id', userId),
      admin.from('company_access').select('company_id').eq('user_id', userId),
    ]);
    const allowed = new Set(
      [...(profiles ?? []), ...(access ?? [])].map((r: any) => r.company_id).filter(Boolean)
    );
    if (allowed.size === 0) return json({ error: 'Sem empresa vinculada' }, 403);

    const companyIds = payload.companyId
      ? allowed.has(payload.companyId)
        ? [payload.companyId]
        : []
      : [...allowed];
    if (companyIds.length === 0) return json({ error: 'Acesso negado à empresa' }, 403);

    const report: any[] = [];

    for (const companyId of companyIds) {
      const { data: contacts } = await admin
        .from('contacts')
        .select('id, name, phone, metadata')
        .eq('company_id', companyId)
        .is('phone', null)
        .limit(limit);

      const pending = contacts ?? [];
      if (pending.length === 0) {
        report.push({ companyId, pending: 0, recovered: 0, sources: {}, ambiguous: [], conflicts: [] });
        continue;
      }

      // remoteJid da conversa como fonte adicional
      const { data: convs } = await admin
        .from('conversations')
        .select('contact_id, metadata')
        .eq('company_id', companyId)
        .in('contact_id', pending.map((c: any) => c.id));
      const convJid = new Map<string, string>();
      for (const c of convs ?? []) {
        const jid = (c as any).metadata?.remoteJid;
        if (jid && !convJid.has((c as any).contact_id)) convJid.set((c as any).contact_id, jid);
      }

      // Mapa LID -> telefone
      const { data: lidRows } = await admin
        .from('lid_phone_mapping')
        .select('lid, phone')
        .eq('company_id', companyId);
      const lidMap = new Map<string, string>();
      for (const r of lidRows ?? []) {
        const p = normalizePhone((r as any).phone);
        if (p) lidMap.set((r as any).lid, p);
      }

      // Índice nome -> telefone a partir da Evolution (API oficial)
      const { data: instances } = await admin
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('company_id', companyId);

      const nameIndex = new Map<string, Set<string>>();
      const addName = (name: string | null | undefined, phone: string | null) => {
        const key = normalizeName(name);
        if (!key || !phone) return;
        if (!nameIndex.has(key)) nameIndex.set(key, new Set());
        nameIndex.get(key)!.add(phone);
      };

      for (const inst of instances ?? []) {
        const instance = (inst as any).instance_name;
        if (!instance || !EVOLUTION_API_URL || !EVOLUTION_API_KEY) continue;

        const remoteContacts = await evolutionPost(`/chat/findContacts/${instance}`, {});
        for (const rc of Array.isArray(remoteContacts) ? remoteContacts : []) {
          const phone = phoneFromJid(rc?.remoteJid || rc?.id) ?? normalizePhone(rc?.number);
          addName(rc?.pushName || rc?.name || rc?.verifiedName, phone);
        }

        const remoteChats = await evolutionPost(`/chat/findChats/${instance}`, {});
        for (const ch of Array.isArray(remoteChats) ? remoteChats : []) {
          const phone = phoneFromJid(ch?.remoteJid || ch?.id) ?? normalizePhone(ch?.number);
          addName(ch?.pushName || ch?.name, phone);
        }
      }

      // Telefones já usados na empresa (evita violar unicidade)
      const { data: used } = await admin
        .from('contacts')
        .select('phone')
        .eq('company_id', companyId)
        .not('phone', 'is', null);
      const usedPhones = new Set((used ?? []).map((u: any) => u.phone));

      const sources: Record<string, number> = { jid: 0, lid: 0, evolution_name: 0 };
      const ambiguous: any[] = [];
      const conflicts: any[] = [];
      let recovered = 0;

      for (const contact of pending) {
        const jid = (contact as any).metadata?.remoteJid || convJid.get((contact as any).id) || null;
        let phone: string | null = null;
        let source = '';

        phone = phoneFromJid(jid);
        if (phone) source = 'jid';

        if (!phone) {
          const lid = lidFromJid(jid);
          if (lid && lidMap.has(lid)) {
            phone = lidMap.get(lid)!;
            source = 'lid';
          }
        }

        if (!phone) {
          const candidates = nameIndex.get(normalizeName((contact as any).name));
          if (candidates && candidates.size === 1) {
            phone = [...candidates][0];
            source = 'evolution_name';
          } else if (candidates && candidates.size > 1) {
            ambiguous.push({ id: (contact as any).id, name: (contact as any).name, options: [...candidates] });
          }
        }

        if (!phone) continue;

        if (usedPhones.has(phone)) {
          conflicts.push({ id: (contact as any).id, name: (contact as any).name, phone });
          continue;
        }

        if (!dryRun) {
          const { error } = await admin
            .from('contacts')
            .update({ phone, metadata: { ...((contact as any).metadata ?? {}), phoneRecoveredFrom: source } })
            .eq('id', (contact as any).id)
            .is('phone', null);
          if (error) {
            conflicts.push({ id: (contact as any).id, name: (contact as any).name, phone, error: error.message });
            continue;
          }
        }

        usedPhones.add(phone);
        sources[source] = (sources[source] ?? 0) + 1;
        recovered += 1;
      }

      report.push({
        companyId,
        pending: pending.length,
        recovered,
        sources,
        ambiguous: ambiguous.slice(0, 50),
        ambiguousTotal: ambiguous.length,
        conflicts: conflicts.slice(0, 50),
        conflictsTotal: conflicts.length,
      });
    }

    return json({ dryRun, report });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
