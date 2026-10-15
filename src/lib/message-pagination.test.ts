import { describe, it, expect } from 'vitest';
import { compareMessages, mergeMessages, Keyed } from './message-pagination';

const PAGE = 50;
const make = (n: number, sameTsEvery = 0): Keyed[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `m${String(i).padStart(4, '0')}`,
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, sameTsEvery ? Math.floor(i / sameTsEvery) : i)).toISOString(),
  }));

// Simula o banco com o mesmo cursor composto usado no hook
const older = (db: Keyed[], c: Keyed | null) =>
  [...db].sort(compareMessages).reverse()
    .filter(m => !c || m.timestamp < c.timestamp || (m.timestamp === c.timestamp && m.id < c.id))
    .slice(0, PAGE);

function walk(db: Keyed[]) {
  let list: Keyed[] = [];
  let cursor: Keyed | null = null;
  let pages = 0;
  for (;;) {
    const page = older(db, cursor);
    pages++;
    list = mergeMessages(list, page);
    if (page.length < PAGE) break;
    cursor = list[0];
  }
  return { list, pages };
}

describe('paginação do histórico', () => {
  for (const n of [50, 100, 300, 306]) {
    it(`percorre ${n} mensagens sem perder nem duplicar`, () => {
      const db = make(n);
      const { list } = walk(db);
      expect(list.length).toBe(n);
      expect(list.map(m => m.id)).toEqual([...db].sort(compareMessages).map(m => m.id));
    });
  }
  it('não pula mensagens com horário idêntico na divisa entre páginas', () => {
    const db = make(306, 7);
    expect(walk(db).list.length).toBe(306);
  });
  it('mescla de recuperação não duplica e mantém temporárias no fim', () => {
    const base = make(10);
    const merged = mergeMessages([...base, { id: 'temp-1', timestamp: '0' }], [...base.slice(5), ...make(12).slice(10)]);
    expect(merged.length).toBe(13);
    expect(merged[merged.length - 1].id).toBe('temp-1');
  });
});
