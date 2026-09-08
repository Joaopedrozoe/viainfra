import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type GroupAction =
  | "info"
  | "participants"
  | "create"
  | "updateSubject"
  | "updateDescription"
  | "updatePicture"
  | "updateParticipant"
  | "updateSetting"
  | "inviteCode"
  | "revokeInviteCode"
  | "leave"
  | "list";

interface RunGroupActionArgs {
  companyId: string;
  action: GroupAction;
  conversationId?: string;
  payload?: Record<string, unknown>;
  silent?: boolean;
  successMessage?: string;
}

interface GroupActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Wrapper para a edge function whatsapp-group-action, com toasts e loading state.
 */
export const useGroupActions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const runGroupAction = useCallback(async <T = unknown>({
    companyId,
    action,
    conversationId,
    payload,
    silent = false,
    successMessage,
  }: RunGroupActionArgs): Promise<GroupActionResult<T>> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-group-action", {
        body: { companyId, action, conversationId, payload },
      });

      if (error) {
        const message = (error as { message?: string }).message || "Falha ao executar ação de grupo";
        if (!silent) toast.error(message);
        return { ok: false, error: message };
      }

      const result = data as GroupActionResult<T>;
      if (!result?.ok) {
        const message = result?.error || "Falha ao executar ação de grupo";
        if (!silent) toast.error(message);
        return { ok: false, error: message };
      }

      if (!silent && successMessage) {
        toast.success(successMessage);
      }

      return { ok: true, data: result.data as T };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao executar ação de grupo";
      if (!silent) toast.error(message);
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { runGroupAction, isLoading };
};
