/** Ordenação determinística e mesclagem de mensagens (horário + id). */
export interface Keyed { id: string; timestamp: string }

export const compareMessages = (a: Keyed, b: Keyed) => {
  const t = a.timestamp.localeCompare(b.timestamp);
  return t !== 0 ? t : a.id.localeCompare(b.id);
};

/** Filtro PostgREST: mensagens estritamente ANTERIORES ao cursor. */
export const olderThanFilter = (c: Keyed) =>
  `created_at.lt.${c.timestamp},and(created_at.eq.${c.timestamp},id.lt.${c.id})`;

/** Filtro PostgREST: mensagens estritamente POSTERIORES ao cursor. */
export const newerThanFilter = (c: Keyed) =>
  `created_at.gt.${c.timestamp},and(created_at.eq.${c.timestamp},id.gt.${c.id})`;

/** Mescla sem duplicar; temporárias (temp-) ficam no fim. */
export function mergeMessages<T extends Keyed>(current: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const m of current) map.set(m.id, m);
  for (const m of incoming) if (!map.has(m.id)) map.set(m.id, m);
  const all = [...map.values()];
  const real = all.filter(m => !m.id.startsWith('temp-')).sort(compareMessages);
  const temps = all.filter(m => m.id.startsWith('temp-'));
  return [...real, ...temps];
}

/** Última mensagem confirmada (não temporária). */
export function newestConfirmed<T extends Keyed>(list: T[]): T | null {
  for (let i = list.length - 1; i >= 0; i--) if (!list[i].id.startsWith('temp-')) return list[i];
  return null;
}
