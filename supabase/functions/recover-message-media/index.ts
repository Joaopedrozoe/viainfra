import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Attempt = { step: string; ok: boolean; detail: string };

const EXT: Record<string, string> = {
  video: "mp4",
  image: "jpg",
  audio: "mp3",
  document: "bin",
};

function mediaTypeFromContent(content: string): "video" | "image" | "audio" | "document" {
  if (content.includes("[Vídeo]")) return "video";
  if (content.includes("[Áudio")) return "audio";
  if (content.includes("[Documento")) return "document";
  return "image";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const evolutionUrl = (Deno.env.get("EVOLUTION_API_URL") || "https://api.viainfra.chat").replace(/\/$/, "");
  const evolutionKey = Deno.env.get("EVOLUTION_API_KEY") || "";

  try {
    const body = await req.json().catch(() => ({}));
    const messageId = String(body?.messageId || "");
    const dryRun = body?.dryRun === true;
    if (!messageId) return json({ ok: false, error: "Informe messageId" }, 400);
    if (!evolutionKey) return json({ ok: false, error: "EVOLUTION_API_KEY não configurada" }, 500);

    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("id, content, metadata, created_at, conversation_id, conversations!inner(company_id, metadata)")
      .eq("id", messageId)
      .maybeSingle();

    if (msgError || !message) return json({ ok: false, error: "Mensagem não encontrada" }, 404);

    const metadata = (message.metadata || {}) as Record<string, unknown>;
    if ((metadata as any).attachment?.url) {
      return json({ ok: true, alreadyAvailable: true, attachment: (metadata as any).attachment });
    }

    const convMeta = ((message.conversations as any)?.metadata || {}) as Record<string, unknown>;
    const instanceName = String(convMeta.instanceName || "");
    const remoteJid = String(convMeta.remoteJid || "");
    const waId = String(metadata.external_id || metadata.messageId || (metadata as any)?.key?.id || "");
    const mediaType = mediaTypeFromContent(String(message.content || ""));

    if (!instanceName) return json({ ok: false, error: "Conversa sem instância WhatsApp definida" }, 400);
    if (!waId) return json({ ok: false, error: "Mensagem sem identificador do WhatsApp" }, 400);

    const attempts: Attempt[] = [];

    const callEvolution = async (path: string, payload: unknown) => {
      const response = await fetch(`${evolutionUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolutionKey },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return { status: response.status, ok: response.ok, data, raw: text };
    };

    // 1) Localiza a mensagem original na instância (leitura, sem envio).
    const found = await callEvolution(`/chat/findMessages/${instanceName}`, {
      where: { key: { id: waId } },
    });
    const records: any[] = Array.isArray(found.data)
      ? found.data
      : found.data?.messages?.records || found.data?.messages || found.data?.data || [];
    attempts.push({
      step: "findMessages",
      ok: found.ok && records.length > 0,
      detail: found.ok
        ? `${records.length} registro(s) encontrado(s)`
        : `HTTP ${found.status}: ${String(found.raw).substring(0, 200)}`,
    });

    const original = records[0] || null;
    const key = original?.key || { id: waId, remoteJid: remoteJid || undefined, fromMe: false };

    // 2) Solicita o binário da mídia à instância.
    let base64: string | null = null;
    let mimeType: string | undefined;

    const b64 = await callEvolution(`/chat/getBase64FromMediaMessage/${instanceName}`, {
      message: { key },
      convertToMp4: false,
    });
    if (b64.ok && typeof b64.data?.base64 === "string" && b64.data.base64.length > 100) {
      base64 = b64.data.base64;
      mimeType = b64.data?.mimetype;
      attempts.push({ step: "getBase64FromMediaMessage", ok: true, detail: `${base64.length} caracteres` });
    } else {
      attempts.push({
        step: "getBase64FromMediaMessage",
        ok: false,
        detail: `HTTP ${b64.status}: ${String(b64.raw).substring(0, 300)}`,
      });
    }

    // 3) Alternativa: url direta guardada na instância.
    let downloaded: Uint8Array | null = null;
    if (!base64 && original?.message) {
      const node =
        original.message.videoMessage ||
        original.message.imageMessage ||
        original.message.audioMessage ||
        original.message.documentMessage;
      const url = node?.url;
      if (url) {
        try {
          const direct = await fetch(url);
          if (direct.ok) {
            downloaded = new Uint8Array(await direct.arrayBuffer());
            mimeType = node?.mimetype || mimeType;
            attempts.push({ step: "downloadDirectUrl", ok: true, detail: `${downloaded.byteLength} bytes` });
          } else {
            attempts.push({ step: "downloadDirectUrl", ok: false, detail: `HTTP ${direct.status}` });
          }
        } catch (error) {
          attempts.push({ step: "downloadDirectUrl", ok: false, detail: String(error).substring(0, 200) });
        }
      } else {
        attempts.push({ step: "downloadDirectUrl", ok: false, detail: "Sem url de mídia no registro" });
      }
    }

    if (base64 && !downloaded) {
      const binary = atob(base64);
      downloaded = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) downloaded[i] = binary.charCodeAt(i);
    }

    if (!downloaded || downloaded.byteLength < 1000) {
      return json({
        ok: false,
        recovered: false,
        messageId,
        waId,
        mediaType,
        instanceName,
        attempts,
        error: "A mídia não está mais disponível no WhatsApp para esta mensagem",
      });
    }

    if (dryRun) {
      return json({ ok: true, recovered: false, dryRun: true, bytes: downloaded.byteLength, attempts });
    }

    const ext = mimeType?.includes("mp4") ? "mp4" : EXT[mediaType] || "bin";
    const path = `${message.conversation_id}/recovered-${Date.now()}-${waId.substring(0, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, downloaded, { contentType: mimeType || `${mediaType}/${ext}`, upsert: false });

    if (uploadError) {
      return json({ ok: false, recovered: false, attempts, error: `Falha ao guardar arquivo: ${uploadError.message}` }, 500);
    }

    const { data: pub } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    const attachment = { type: mediaType, url: pub.publicUrl, mimeType: mimeType || `${mediaType}/${ext}` };

    const { error: updateError } = await supabase
      .from("messages")
      .update({
        metadata: {
          ...metadata,
          attachment,
          mediaRecovered: true,
          mediaRecoveredAt: new Date().toISOString(),
        },
      })
      .eq("id", messageId);

    if (updateError) {
      return json({ ok: false, recovered: false, attempts, error: updateError.message }, 500);
    }

    return json({ ok: true, recovered: true, messageId, waId, bytes: downloaded.byteLength, attachment, attempts });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
