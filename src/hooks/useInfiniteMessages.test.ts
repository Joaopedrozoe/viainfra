import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ slots: [] as any[], index: 0, effects: [] as (() => void)[], query: vi.fn() }));
vi.mock('react', () => ({
  useState: (initial: any) => {
    const i = harness.index++;
    if (!(i in harness.slots)) harness.slots[i] = initial;
    return [harness.slots[i], (value: any) => { harness.slots[i] = typeof value === 'function' ? value(harness.slots[i]) : value; }];
  },
  useRef: (initial: any) => {
    const i = harness.index++;
    if (!(i in harness.slots)) harness.slots[i] = { current: initial };
    return harness.slots[i];
  },
  useCallback: (fn: any) => fn,
  useEffect: (fn: () => void) => { harness.effects.push(fn); },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const q: any = {};
  for (const method of ['select', 'eq', 'order', 'or']) q[method] = vi.fn(() => q);
  q.limit = harness.query;
  return q;
} } }));
import { useInfiniteMessages } from './useInfiniteMessages';

function render(id = 'conversation-a', effects = false) {
  harness.index = 0;
  harness.effects = [];
  const hook = useInfiniteMessages(id);
  if (effects) harness.effects.forEach(fn => fn());
  return hook;
}
const row = { id: 'message-1', content: 'Recovered', sender_type: 'user', created_at: '2026-11-18T12:00:00Z', metadata: {} };

beforeEach(() => { harness.slots = []; harness.query.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
describe('empty conversation recovery', () => {
  it('recovers the initial page after a connection error without reopening', async () => {
    harness.query.mockResolvedValueOnce({ data: null, error: { message: 'offline' } })
      .mockResolvedValueOnce({ data: [row], error: null });
    const hook = render('conversation-a', true);
    await hook.loadInitialMessages();
    expect(render().messages).toEqual([]);
    await render().syncLatest();
    expect(render().messages.map(m => m.id)).toEqual(['message-1']);
    expect(harness.query).toHaveBeenCalledTimes(2);
  });
  it('picks up a missed first message in a previously empty conversation', async () => {
    harness.query.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [row], error: null });
    await render('conversation-a', true).loadInitialMessages();
    await render().syncLatest();
    expect(render().messages.map(m => m.id)).toEqual(['message-1']);
  });
  it('prevents overlapping empty-page recovery requests', async () => {
    let finish: (v: any) => void = () => {};
    harness.query.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const hook = render('conversation-a', true);
    const first = hook.syncLatest();
    await hook.syncLatest();
    expect(harness.query).toHaveBeenCalledTimes(1);
    finish({ data: [row], error: null });
    await first;
    expect(render().messages).toHaveLength(1);
  });
  it('discards recovery responses after switching conversations', async () => {
    let finish: (v: any) => void = () => {};
    harness.query.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const recovering = render('conversation-a', true).syncLatest();
    render('conversation-b', true);
    finish({ data: [row], error: null });
    await recovering;
    expect(render('conversation-b').messages).toEqual([]);
  });
});