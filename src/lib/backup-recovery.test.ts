import { describe, expect, it, vi } from 'vitest';
import { FINALIZATION_GRACE_MS, reconcileRun, type BackupStore, type RunRow } from '../../supabase/functions/_shared/backup-client';
import { armValidationCheck, recoverFinalizing } from '../../supabase/functions/backup-export-schema/full';

const id = '7e051ac8-3885-4071-9ec8-3fe75d5ad3d6';
const hash = 'a'.repeat(64);
function setup(age: number, state: string, received = hash) {
  const run: RunRow = { id, status: 'finalizing', manifest_sha256: hash, receiver_confirmed_at: null,
    updated_at: new Date(Date.now() - age).toISOString() };
  const store: BackupStore = {
    createRun: vi.fn(), insertItems: vi.fn(), updateItem: vi.fn(), getRun: async () => run,
    updateRunIf: async (_, from, patch) => { if (run.status !== from) return false; Object.assign(run, patch); return true; },
  };
  const cfg = { baseUrl: 'https://receiver.invalid', token: 'test-only', project: 'test',
    fetch: vi.fn(async () => new Response(JSON.stringify({ run_id: id, state, manifest_sha256: received }))) as unknown as typeof fetch };
  return { run, store, cfg };
}
describe('backup validation recovery', () => {
  it('promotes only a matching receiver-confirmed manifest even after the grace period', async () => {
    const { run, store, cfg } = setup(FINALIZATION_GRACE_MS + 1, 'COMPLETE');
    expect(await reconcileRun(store, cfg, id)).toBe('promoted');
    expect(run.status).toBe('complete');
    expect(run.receiver_confirmed_at).toBeTruthy();
  });
  it('releases an unconfirmed run after one hour without claiming validation', async () => {
    const { run, store, cfg } = setup(FINALIZATION_GRACE_MS + 1, 'OPEN');
    expect(await reconcileRun(store, cfg, id)).toBe('expired');
    expect(run.status).toBe('incomplete');
    expect(run.receiver_confirmed_at).toBeNull();
  });
  it('keeps recent uncertainty pending for subsequent checks', async () => {
    const { run, store, cfg } = setup(0, 'OPEN');
    expect(await reconcileRun(store, cfg, id)).toBe('still_open');
    expect(run.status).toBe('finalizing');
  });
  it('releases expired network failures without changing their integrity claim', async () => {
    const { run, store, cfg } = setup(FINALIZATION_GRACE_MS + 1, 'OPEN');
    cfg.fetch = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect(await reconcileRun(store, cfg, id)).toBe('expired');
    expect(run.status).toBe('incomplete');
  });
  it('rejects a mismatching manifest', async () => {
    const { run, store, cfg } = setup(0, 'COMPLETE', 'b'.repeat(64));
    expect(await reconcileRun(store, cfg, id)).toBe('hash_mismatch');
    expect(run.status).toBe('failed');
  });
  it('arms a server-side one-shot validation check with an allowed job name', async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    await armValidationCheck({ rpc }, id);
    const [name, args] = rpc.mock.calls[0] as unknown as [string, any];
    expect(name).toBe('backup_schedule_once');
    expect(args._job).toMatch(/^backup-retry-[a-z0-9]+$/);
    expect(args._body).toEqual({ mode: 'reconcile', run_id: id });
  });
  it('poll recovery updates scheduled occurrence and clears validation job after confirmation', async () => {
    const { run, cfg } = setup(0, 'COMPLETE');
    const rpc = vi.fn(async () => ({ error: null }));
    const occurrenceUpdates: any[] = [];
    const admin = { rpc, from: (table: string) => {
      const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: run }),
        single: async () => ({ data: table === 'backup_runs' ? { ...run, occurrence_key: '2026-11-18T12:00Z' } : { attempts: 1 } }),
        update: (patch: any) => { if (table === 'backup_runs') Object.assign(run, patch); else if (table === 'backup_schedule_occurrences') occurrenceUpdates.push(patch); return q; },
        then: (resolve: any) => resolve({ data: [{ id }], error: null }) };
      return q;
    } };
    expect(await recoverFinalizing(admin, cfg)).toBe('promoted');
    expect(run.status).toBe('complete');
    expect(occurrenceUpdates[0].status).toBe('complete');
    expect(rpc).toHaveBeenCalledWith('backup_unschedule_job', { _job: `backup-retry-validation${id.replace(/-/g, '')}` });
  });
});