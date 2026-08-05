import { useIncomingCalls } from "@/hooks/useIncomingCalls";
import { IncomingCallDialog } from "@/components/app/calls/IncomingCallDialog";

/** Monta o diálogo de chamada entrante em qualquer tela do app. */
export const IncomingCallListener = () => {
  const { incomingCall, dismissIncomingCall } = useIncomingCalls();
  if (!incomingCall) return null;
  return <IncomingCallDialog call={incomingCall} onDismiss={dismissIncomingCall} />;
};
