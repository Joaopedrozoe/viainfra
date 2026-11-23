import type { Database } from "@/integrations/supabase/types";

export type Announcement = Database["public"]["Tables"]["company_announcements"]["Row"];
export type AnnouncementKind = "update" | "alert" | "incident" | "info";
export const announcementKinds: Record<AnnouncementKind, string> = {
  update: "Atualização", alert: "Alerta", incident: "Incidente", info: "Informativo",
};
export function announcementKind(kind: string): AnnouncementKind {
  return kind in announcementKinds ? kind as AnnouncementKind : "info";
}
export function dismissalKey(announcement: Announcement, userId: string): string {
  return `announcement:${userId}:${announcement.company_id}:${announcement.id}:${announcement.updated_at}:${announcement.published_at}`;
}
export function visibleAnnouncement(rows: Announcement[], companyId: string, userId: string, dismissed: string[]): Announcement | undefined {
  return rows.find(row => row.company_id === companyId && row.status === "published" &&
    (!row.dismissible || !dismissed.includes(dismissalKey(row, userId))));
}