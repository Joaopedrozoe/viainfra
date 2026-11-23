import { AlertTriangle, Info, Megaphone, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { announcementKind, announcementKinds, type Announcement } from "@/lib/announcements";

const icons = { update: Sparkles, alert: AlertTriangle, incident: Megaphone, info: Info };
type StripNotice = Pick<Announcement, "title" | "summary" | "kind" | "release_version" | "dismissible">;
export function AnnouncementStrip({ notice, onDetails, onDismiss }: {
  notice: StripNotice; onDetails?: () => void; onDismiss?: () => void;
}) {
  const kind = announcementKind(notice.kind);
  const Icon = icons[kind];
  return (
    <section aria-label="Aviso da empresa" className={`announcement-tone announcement-${kind} flex shrink-0 items-center gap-3 border-b px-4 py-2.5`}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-semibold">{announcementKinds[kind]}{notice.release_version ? ` · ${notice.release_version}` : ""}</span>
          <strong className="break-words [overflow-wrap:anywhere]">{notice.title || "Título do aviso"}</strong>
        </div>
        <p className="line-clamp-2 break-words [overflow-wrap:anywhere]">{notice.summary || "Resumo do aviso"}</p>
      </div>
      {onDetails && <Button variant="ghost" size="sm" className="shrink-0 px-2 text-inherit hover:bg-background/20 hover:text-inherit" onClick={onDetails}>Detalhes</Button>}
      {notice.dismissible && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-inherit hover:bg-background/20 hover:text-inherit" aria-label="Fechar aviso" title="Fechar aviso" onClick={onDismiss}><X /></Button>}
    </section>
  );
}