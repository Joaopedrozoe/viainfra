export interface GroupishConversation {
  contact?: {
    metadata?: Record<string, unknown> | null;
  } | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Detecta se uma conversa representa um grupo de WhatsApp.
 * Considera tanto o metadata do contato quanto o da própria conversa.
 */
export const isGroupConversation = (conversation?: GroupishConversation | null): boolean => {
  if (!conversation) return false;

  const contactMetadata = (conversation.contact?.metadata || {}) as Record<string, unknown>;
  const conversationMetadata = (conversation.metadata || {}) as Record<string, unknown>;

  if (contactMetadata.isGroup === true || conversationMetadata.isGroup === true) return true;

  const remoteJid = String(contactMetadata.remoteJid || conversationMetadata.remoteJid || '');
  return remoteJid.endsWith('@g.us');
};

export const getGroupParticipantsCount = (conversation?: GroupishConversation | null): number | undefined => {
  const contactMetadata = (conversation?.contact?.metadata || {}) as Record<string, unknown>;
  const conversationMetadata = (conversation?.metadata || {}) as Record<string, unknown>;
  const count = contactMetadata.participantsCount ?? conversationMetadata.participantsCount;
  return typeof count === 'number' ? count : undefined;
};
