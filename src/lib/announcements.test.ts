import { describe, expect, it } from "vitest";
import { dismissalKey, visibleAnnouncement, type Announcement } from "./announcements";

const notice: Announcement = {
  id: "release-1", company_id: "viainfra", title: "Release", summary: "Resumo", details: "",
  kind: "update", status: "published", dismissible: true, release_version: "1.0",
  created_at: "2026-11-23T14:00:00Z", updated_at: "2026-11-23T14:00:00Z", published_at: "2026-11-23T14:00:00Z",
};
describe("company announcement rules", () => {
  it("never shows a Viainfra notice in Vialogistic", () => {
    expect(visibleAnnouncement([notice], "vialogistic", "admin", [])).toBeUndefined();
  });
  it("never shows drafts", () => {
    expect(visibleAnnouncement([{ ...notice, status: "draft" }], "viainfra", "admin", [])).toBeUndefined();
  });
  it("hides a closable banner after the user closes it", () => {
    expect(visibleAnnouncement([notice], "viainfra", "admin", [dismissalKey(notice, "admin")])).toBeUndefined();
  });
  it("does not hide a required banner even with an old dismissal", () => {
    const required = { ...notice, dismissible: false };
    expect(visibleAnnouncement([required], "viainfra", "admin", [dismissalKey(required, "admin")])).toEqual(required);
  });
  it("shows a changed release again", () => {
    const updated = { ...notice, updated_at: "2026-11-23T15:00:00Z" };
    expect(visibleAnnouncement([updated], "viainfra", "admin", [dismissalKey(notice, "admin")])).toEqual(updated);
  });
  it("keeps dismissals separate for each user", () => {
    expect(visibleAnnouncement([notice], "viainfra", "other-user", [dismissalKey(notice, "admin")])).toEqual(notice);
  });
});