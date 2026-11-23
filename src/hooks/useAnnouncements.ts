import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export function useAnnouncementAdmin() {
  const { company, user } = useAuth();
  return useQuery({
    queryKey: ["announcement-admin", company?.id, user?.id],
    enabled: !!company?.id && !!user?.id,
    queryFn: async () => {
      if (!company?.id || !user?.id) return false;
      const { data, error } = await supabase.rpc("has_announcement_admin", { _company_id: company.id });
      if (error) throw error;
      return data === true;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useAnnouncements(all = false, enabled = true) {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = company?.id;
  const userId = user?.id;
  const query = useQuery({
    queryKey: ["announcements", companyId, userId, all ? "all" : "published"],
    enabled: enabled && !!companyId && !!userId,
    queryFn: async () => {
      if (!companyId || !userId) return [];
      let request = supabase.from("company_announcements").select("*").eq("company_id", companyId);
      if (!all) request = request.eq("status", "published");
      const { data, error } = await request.order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    staleTime: 15000,
  });

  useEffect(() => {
    if (!enabled || !companyId || !userId) return;
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["announcements", companyId, userId] }); };
    const channel = supabase.channel(`announcements-${companyId}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "company_announcements", filter: `company_id=eq.${companyId}` }, refresh)
      .subscribe(status => { if (status === "SUBSCRIBED") refresh(); });
    return () => { void supabase.removeChannel(channel); };
  }, [companyId, userId, enabled, queryClient]);
  return query;
}