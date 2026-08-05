/**
 * Rastreia qual conversa está aberta na tela para evitar notificar
 * (som + desktop) mensagens que o atendente já está vendo.
 */
let activeConversationId: string | null = null;

export const setActiveConversationId = (id: string | null | undefined) => {
  activeConversationId = id || null;
};

export const getActiveConversationId = () => activeConversationId;

const isWindowVisible = () => {
  if (typeof document === 'undefined') return false;
  if (document.visibilityState !== 'visible') return false;
  return typeof document.hasFocus === 'function' ? document.hasFocus() : true;
};

/** true quando a conversa está aberta e a aba está em foco */
export const isConversationInFocus = (conversationId: string) =>
  isWindowVisible() && activeConversationId === conversationId;

/** Atualiza o título da aba com o total de conversas não lidas */
export const setUnreadTitleBadge = (count: number, baseTitle?: string) => {
  if (typeof document === 'undefined') return;
  const base = baseTitle || document.title.replace(/^\(\d+\)\s*/, '');
  document.title = count > 0 ? `(${count}) ${base}` : base;
};
