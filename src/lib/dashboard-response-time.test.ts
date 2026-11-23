import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { computeAverageResponseTime } from "@/components/app/dashboard/dashboardUtils";

describe("tempo de resposta do painel", () => {
  it("mede do cliente até a próxima resposta da equipe", () => {
    const rows = [
      { conversation_id: "a", sender_type: "user", created_at: "2026-11-23T10:00:00Z" },
      { conversation_id: "a", sender_type: "user", created_at: "2026-11-23T10:00:30Z" },
      { conversation_id: "a", sender_type: "agent", created_at: "2026-11-23T10:01:00Z" },
      { conversation_id: "b", sender_type: "user", created_at: "2026-11-23T10:00:00Z" },
      { conversation_id: "b", sender_type: "agent", created_at: "2026-11-23T10:03:00Z" },
    ];
    expect(computeAverageResponseTime(rows)).toBe(120);
  });
});
