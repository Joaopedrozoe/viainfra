/**
 * Acesso resiliente a anexos do inbox.
 *
 * Motivo: extensões de navegador (bloqueadores de anúncio, antivírus, proxies
 * corporativos) podem bloquear a navegação direta para a URL pública do Storage
 * (ERR_BLOCKED_BY_CLIENT). Para não perder o anexo, sempre tentamos primeiro
 * baixar o arquivo pelo cliente Supabase (mesma origem de API já usada pelo app)
 * e servir por blob local; só como último recurso abrimos a URL direta.
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PUBLIC_MARKER = "/storage/v1/object/public/";
const SIGN_MARKER = "/storage/v1/object/sign/";

export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const marker = url.includes(PUBLIC_MARKER)
      ? PUBLIC_MARKER
      : url.includes(SIGN_MARKER)
        ? SIGN_MARKER
        : null;
    if (!marker) return null;
    const rest = url.split(marker)[1]?.split("?")[0];
    if (!rest) return null;
    const [bucket, ...pathParts] = rest.split("/");
    if (!bucket || pathParts.length === 0) return null;
    return { bucket, path: decodeURIComponent(pathParts.join("/")) };
  } catch {
    return null;
  }
}

/** Baixa o anexo e devolve uma object URL local (ou null se não foi possível). */
export async function fetchAttachmentBlobUrl(url: string): Promise<string | null> {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url || null;

  const parsed = parseStorageUrl(url);
  if (parsed) {
    try {
      const { data, error } = await supabase.storage.from(parsed.bucket).download(parsed.path);
      if (!error && data) return URL.createObjectURL(data);
    } catch {
      /* segue para o fetch direto */
    }
  }

  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (res.ok) return URL.createObjectURL(await res.blob());
  } catch {
    /* bloqueado pelo cliente */
  }

  return null;
}

const BLOCKED_MESSAGE =
  "Uma extensão do navegador (bloqueador/antivírus) ou a rede está bloqueando o arquivo. Libere o domínio de armazenamento ou copie o link e abra em outra janela.";

/** Abre ou baixa o anexo com fallback e mensagem clara quando bloqueado. */
export async function openAttachment(url: string, filename?: string): Promise<boolean> {
  if (!url) return false;

  const blobUrl = await fetchAttachmentBlobUrl(url);
  if (blobUrl) {
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    if (filename) anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (blobUrl.startsWith("blob:")) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }
    return true;
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    toast.error("Não foi possível abrir o anexo", {
      description: BLOCKED_MESSAGE,
      action: {
        label: "Copiar link",
        onClick: () => void copyAttachmentLink(url),
      },
    });
    return false;
  }
  return true;
}

export async function copyAttachmentLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link do anexo copiado");
  } catch {
    toast.error("Não foi possível copiar o link");
  }
}

export const ATTACHMENT_BLOCKED_MESSAGE = BLOCKED_MESSAGE;
