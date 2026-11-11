/** Ignore incomplete delivery records instead of throwing during history rendering. */
export function broadcastDeliveryStatuses(messages: { metadata: unknown }[]): Record<string, string> {
  const statuses: Record<string, string> = {};
  for (const message of messages) {
    const metadata = message.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) continue;
    const record = metadata as Record<string, unknown>;
    if (typeof record.whatsappMessageId !== 'string' || typeof record.whatsappStatus !== 'string') continue;
    statuses[record.whatsappMessageId] = record.whatsappStatus;
  }
  return statuses;
}