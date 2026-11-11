export function whatsappValidationUnavailable(status: number, body: string): boolean {
  if (status !== 400) return false;
  try {
    const data = JSON.parse(body);
    return Array.isArray(data?.message) && data.message.includes('Method not available on WhatsApp Business API');
  } catch {
    return false;
  }
}

export function permitsValidatedRecipients(statuses: string[]): boolean {
  return statuses.length > 0 && statuses.every(status => status === 'valid' || status === 'unavailable');
}