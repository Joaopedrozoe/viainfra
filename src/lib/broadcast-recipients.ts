export function normalizeRecipient(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return /^[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

export function parseRecipients(text: string) {
  const values = text.split(/[\n,;]+/).map(v => v.trim().replace(/^"|"$/g, '')).filter(Boolean);
  const phones = new Set<string>();
  const invalid: string[] = [];
  for (const value of values) {
    const phone = normalizeRecipient(value);
    if (phone) phones.add(phone);
    else if (!/^(phone|telefone|celular|numero|número)$/i.test(value)) invalid.push(value);
  }
  return { phones: [...phones], invalid };
}