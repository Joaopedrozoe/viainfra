import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingMessage {
  stanzaId?: string | null;
  fromMe?: boolean;
  content?: string;
  timestamp?: string | null;
  senderName?: string;
  quotedContent?: string;
  quotedSender?: string;
  attachment?: {
    type?: string;
    url?: string;
    filename?: string;
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeName(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Nome "núcleo": sem trechos entre parênteses e sem sufixos de função. */
function coreName(value: string): string {
  const withoutParens = String(value || "").replace(/\([^)]*\)/g, " ");
  let base = normalizeName(withoutParens);
  const suffixes = [
    "colaborador","colaboradora","funcionario","funcionaria","motorista",
    "vendedor","vendedora","atendente","cliente","fornecedor","fornecedora",
    "mecanico","mecanica","gerente","socio","socia","adm","rh",
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (base.endsWith(` ${suffix}`)) {
        base = base.slice(0, -(suffix.length + 1)).trim();
        changed = true;
      }
    }
  }
  return base;
}

/** Considera igual quando o núcleo bate ou um nome é prefixo do outro. */
function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const ca = coreName(a);
  const cb = coreName(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;

  const shorter = ca.length <= cb.length ? ca : cb;
  const longer = ca.length <= cb.length ? cb : ca;
  if (shorter.length < 10) return false;
  // só aceita prefixo em limite de palavra ("lukas miranda primetrac" x "lukas miranda primetrac autotrac")
  return longer.startsWith(`${shorter} `);
}

function normalizePhone(value?: string | null): string {
  if (!value) return "";
  let digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 11 && !digits.startsWith("55")) digits = `55${digits}`;
  return digits;
}

/** Variantes do mesmo número BR: com/sem 55 e com/sem o nono dígito. */
function phoneVariants(value?: string | null): string[] {
  const base = normalizePhone(value);
  if (!base) return [];
  const set = new Set<string>([base]);
  const raw = String(value).replace(/\D/g, "");
  if (raw) set.add(raw);

  if (base.startsWith("55")) {
    const national = base.slice(2);
    set.add(national);
    if (national.length === 11 && national[2] === "9") {
      const without9 = national.slice(0, 2) + national.slice(3);
      set.add(without9);
      set.add(`55${without9}`);
    }
    if (national.length === 10) {
      const with9 = `${national.slice(0, 2)}9${national.slice(2)}`;
      set.add(with9);
      set.add(`55${with9}`);
    }
  }
  return [...set].filter(Boolean);
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // ---- autenticação ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ error: "Não autenticado" }, 401);

    const body = await req.json();
    const action = String(body?.action || "");
    const companyId = String(body?.companyId || "");
    if (!companyId) return json({ error: "companyId é obrigatório" }, 400);

    // ---- autorização: usuário precisa ter acesso à empresa ----
    const [{ data: profileRows }, { data: accessRows }] = await Promise.all([
      supabase.from("profiles").select("id").eq("user_id", user.id).eq("company_id", companyId),
      supabase
        .from("company_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_id", companyId),
    ]);

    if (!(profileRows?.length || accessRows?.length)) {
      return json({ error: "Sem acesso a esta empresa" }, 403);
    }

    // ---------------------------------------------------------------
    if (action === "resolve") {
      const name = String(body?.name || "").trim() || "Contato importado";
      const phone = normalizePhone(body?.phone);
      const isGroup = Boolean(body?.isGroup);
      let conversationId: string | null = body?.conversationId || null;
      let contactId: string | null = body?.contactId || null;

      // valida conversa informada
      if (conversationId) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("id, contact_id")
          .eq("id", conversationId)
          .eq("company_id", companyId)
          .maybeSingle();
        if (conv) {
          contactId = conv.contact_id;
        } else {
          conversationId = null;
        }
      }

      // procura contato por telefone ou nome
      if (!conversationId && !contactId) {
        if (phone) {
          const { data } = await supabase
            .from("contacts")
            .select("id")
            .eq("company_id", companyId)
            .eq("phone", phone)
            .limit(1);
          if (data?.length) contactId = data[0].id;
        }
        if (!contactId) {
          const { data } = await supabase
            .from("contacts")
            .select("id, name")
            .eq("company_id", companyId)
            .ilike("name", name)
            .limit(5);
          const hit = (data || []).find((c) => normalizeName(c.name) === normalizeName(name));
          if (hit) contactId = hit.id;
        }
      }

      if (!contactId) {
        const { data: created, error: createError } = await supabase
          .from("contacts")
          .insert({
            company_id: companyId,
            name,
            phone: phone || null,
            metadata: {
              source: "backup-import",
              isGroup,
              importedAt: new Date().toISOString(),
            },
          })
          .select("id")
          .single();
        if (createError) throw createError;
        contactId = created.id;
      } else if (phone) {
        // completa o telefone se estiver vazio (nunca sobrescreve)
        await supabase
          .from("contacts")
          .update({ phone })
          .eq("id", contactId)
          .or("phone.is.null,phone.eq.");
      }

      if (!conversationId) {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("company_id", companyId)
          .eq("contact_id", contactId)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (existing?.length) {
          conversationId = existing[0].id;
        } else {
          const { data: createdConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              company_id: companyId,
              contact_id: contactId,
              channel: "whatsapp",
              status: "open",
              bot_active: false,
              metadata: {
                source: "backup-import",
                isGroup,
                remoteJid: phone ? `${phone}@s.whatsapp.net` : null,
                importedAt: new Date().toISOString(),
              },
            })
            .select("id")
            .single();
          if (convError) throw convError;
          conversationId = createdConv.id;
        }
      }

      return json({ conversationId, contactId });
    }

    // ---------------------------------------------------------------
    if (action === "import") {
      const conversationId = String(body?.conversationId || "");
      const messages: IncomingMessage[] = Array.isArray(body?.messages) ? body.messages : [];
      if (!conversationId) return json({ error: "conversationId é obrigatório" }, 400);
      if (messages.length === 0) return json({ imported: 0, skipped: 0 });
      if (messages.length > 1000) return json({ error: "Lote muito grande" }, 400);

      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("company_id", companyId)
        .maybeSingle();
      if (!conv) return json({ error: "Conversa não pertence à empresa" }, 403);

      // índice de deduplicação da conversa
      const { data: existing } = await supabase
        .from("messages")
        .select("content, sender_type, created_at, metadata")
        .eq("conversation_id", conversationId)
        .limit(20000);

      const existingIds = new Set<string>();
      const existingFingerprints: Array<{ key: string; time: number }> = [];

      for (const row of existing || []) {
        const meta = (row.metadata || {}) as Record<string, unknown>;
        for (const key of ["external_id", "messageId", "whatsappMessageId", "message_id"]) {
          const value = meta[key];
          if (typeof value === "string" && value) existingIds.add(value);
        }
        existingFingerprints.push({
          key: `${row.sender_type}|${(row.content || "").trim().toLowerCase()}`,
          time: new Date(row.created_at).getTime(),
        });
      }

      const toInsert: Record<string, unknown>[] = [];
      let skipped = 0;

      for (const message of messages) {
        const stanzaId = typeof message.stanzaId === "string" ? message.stanzaId : null;
        if (stanzaId && existingIds.has(stanzaId)) {
          skipped++;
          continue;
        }

        const content = (message.content || "").slice(0, 20000);
        const attachment = message.attachment?.url ? message.attachment : undefined;
        if (!content && !attachment) {
          skipped++;
          continue;
        }

        const senderType = message.fromMe ? "agent" : "user";
        const createdAt = message.timestamp ? new Date(message.timestamp) : null;
        const createdAtIso =
          createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toISOString()
            : new Date().toISOString();

        // fallback: mesmo remetente + mesmo texto dentro de ±90s
        if (!stanzaId && content) {
          const key = `${senderType}|${content.trim().toLowerCase()}`;
          const time = new Date(createdAtIso).getTime();
          const duplicate = existingFingerprints.some(
            (fp) => fp.key === key && Math.abs(fp.time - time) <= 90_000,
          );
          if (duplicate) {
            skipped++;
            continue;
          }
        }

        const finalContent =
          content ||
          ({
            image: "[Imagem]",
            video: "[Vídeo]",
            audio: "[Áudio]",
            document: "[Documento]",
          }[attachment?.type || "document"] ?? "[Anexo]");

        toInsert.push({
          conversation_id: conversationId,
          sender_type: senderType,
          content: finalContent,
          created_at: createdAtIso,
          metadata: {
            source: "backup-import",
            external_id: stanzaId,
            messageId: stanzaId,
            fromMe: Boolean(message.fromMe),
            sender_name: message.senderName || null,
            quotedContent: message.quotedContent || null,
            quotedSender: message.quotedSender || null,
            attachment: attachment
              ? {
                  type: attachment.type,
                  url: attachment.url,
                  filename: attachment.filename,
                }
              : null,
            importedAt: new Date().toISOString(),
          },
        });

        if (stanzaId) existingIds.add(stanzaId);
        existingFingerprints.push({
          key: `${senderType}|${finalContent.trim().toLowerCase()}`,
          time: new Date(createdAtIso).getTime(),
        });
      }

      let imported = 0;
      for (let start = 0; start < toInsert.length; start += 200) {
        const slice = toInsert.slice(start, start + 200);
        const { error: insertError } = await supabase.from("messages").insert(slice);
        if (insertError) {
          console.error("[import-chat-backup] insert error:", insertError.message);
          throw insertError;
        }
        imported += slice.length;
      }

      return json({ imported, skipped });
    }

    // ---------------------------------------------------------------
    if (action === "finalize") {
      const conversationId = String(body?.conversationId || "");
      if (!conversationId) return json({ error: "conversationId é obrigatório" }, 400);

      const { data: latest } = await supabase
        .from("messages")
        .select("created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (latest?.length) {
        await supabase
          .from("conversations")
          .update({ updated_at: latest[0].created_at })
          .eq("id", conversationId)
          .eq("company_id", companyId);
      }

      return json({ success: true });
    }

    return json({ error: `Ação desconhecida: ${action}` }, 400);
  } catch (error) {
    console.error("[import-chat-backup] erro:", error);
    return json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      500,
    );
  }
});
