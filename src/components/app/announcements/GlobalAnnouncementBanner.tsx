import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { announcementKind, announcementKinds, dismissalKey, visibleAnnouncement } from "@/lib/announcements";
import { AnnouncementStrip } from "./AnnouncementStrip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function readDismissals(): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem("announcement-dismissals") || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

export function GlobalAnnouncementBanner() {
  const { company, user } = useAuth();
  const notices = useAnnouncements();
  const [dismissed, setDismissed] = useState(readDismissals);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!company?.id || !user?.id) return null;
  const notice = visibleAnnouncement(notices.data || [], company.id, user.id, dismissed);
  if (!notice) return null;
  const dismiss = () => {
    if (!notice.dismissible) return;
    const next = [...dismissed, dismissalKey(notice, user.id)].slice(-100);
    setDismissed(next);
    setOpenId(null);
    try { sessionStorage.setItem("announcement-dismissals", JSON.stringify(next)); } catch { /* Session persistence is optional. */ }
  };
  return <>
    <AnnouncementStrip notice={notice} onDetails={() => setOpenId(`${company.id}:${notice.id}`)} onDismiss={dismiss} />
    <Dialog open={openId === `${company.id}:${notice.id}`} onOpenChange={open => setOpenId(open ? `${company.id}:${notice.id}` : null)}>
      <DialogContent className="mx-0 my-0 w-[calc(100%-2rem)] max-w-xl">
        <DialogHeader className="pr-6">
          <p className="text-sm font-medium text-primary">{announcementKinds[announcementKind(notice.kind)]}{notice.release_version ? ` · ${notice.release_version}` : ""}</p>
          <DialogTitle className="break-words [overflow-wrap:anywhere]">{notice.title}</DialogTitle>
          <DialogDescription className="break-words [overflow-wrap:anywhere]">{notice.summary}</DialogDescription>
        </DialogHeader>
        {notice.details && <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{notice.details}</div>}
        {notice.published_at && <p className="mt-6 text-xs text-muted-foreground">{company.name} · {new Date(notice.published_at).toLocaleString("pt-BR")}</p>}
      </DialogContent>
    </Dialog>
  </>;
}