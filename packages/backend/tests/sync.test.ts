import { check, checkTrue, suite } from '@revivex/test-utils';
import type { Workout } from '@revivex/core';
import {
  InMemoryRemoteStore,
  applyRemoteRows,
  emptySyncState,
  flushOutbox,
  pendingCount,
  pullTable,
  reconcileCollection,
  rowToWorkout,
  statusFor,
  trackedItem,
  workoutToRow,
  type SyncState,
  type WorkoutRow,
} from '../src';
import { makeWorkout } from './fixtures';

const USER = 'user_1';
const NOW = '2026-10-11T09:00:00.000Z';

function deps(remote: InMemoryRemoteStore, collection: () => Workout[], onlyFresh = false) {
  return {
    remote,
    userId: USER,
    onlyFresh,
    getLocal: (_table: string, clientId: string) => collection().find((w) => w.id === clientId),
    toRow: (_table: string, userId: string, item: unknown) => workoutToRow(userId, item as Workout),
  };
}

/** A device: its local collection and sync state, synced the way the apps do it. */
class Device {
  state: SyncState = emptySyncState();
  workouts: Workout[] = [];
  constructor(private readonly remote: InMemoryRemoteStore) {}

  /** What the providers do on every collection change. */
  reconcile(): void {
    this.state = reconcileCollection(this.state, 'workouts', this.workouts, NOW);
  }

  /** Pull, merge into the collection (the merge lands), then the reconcile pass the merge render triggers. */
  async pull(full = false) {
    const pulled = await pullTable<Workout>(this.state, 'workouts', { remote: this.remote, userId: USER, local: this.workouts, fromRow: (row) => rowToWorkout(row as WorkoutRow), full });
    this.state = pulled.state;
    this.workouts = pulled.items;
    this.reconcile();
    return pulled;
  }

  /** Pull whose merge never lands locally (app closed right after the sync bookkeeping was saved). */
  async pullAndCrash(full = false) {
    const pulled = await pullTable<Workout>(this.state, 'workouts', { remote: this.remote, userId: USER, local: this.workouts, fromRow: (row) => rowToWorkout(row as WorkoutRow), full });
    this.state = pulled.state;
    return pulled;
  }

  async flush(onlyFresh = false) {
    const result = await flushOutbox(this.state, deps(this.remote, () => this.workouts, onlyFresh));
    this.state = result.state;
    return result;
  }

  edit(id: string, patch: Partial<Workout>): void {
    this.workouts = this.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w));
    this.reconcile();
  }

  add(workout: Workout): void {
    this.workouts = [...this.workouts, workout];
    this.reconcile();
  }

  remove(id: string): void {
    this.workouts = this.workouts.filter((w) => w.id !== id);
    this.reconcile();
  }

  ids(): string[] {
    return this.workouts.map((w) => w.id).sort();
  }
}

export async function runSyncTests(): Promise<void> {
  let clock = new Date('2026-10-11T09:00:00.000Z');
  const remote = new InMemoryRemoteStore(() => clock);

  suite('sync: reconcile and flush');
  const one = new Device(remote);
  one.workouts = [makeWorkout(), makeWorkout({ id: 'wk_2', title: 'Pull Day' })];
  one.reconcile();
  check('new items are queued as upserts', one.state.outbox.map((e) => [e.clientId, e.op]), [['wk_1', 'upsert'], ['wk_2', 'upsert']]);
  check('status is pending before flush', statusFor(one.state, 'workouts', 'wk_1', true), 'pending');
  check('status is local when cloud is inactive', statusFor(one.state, 'workouts', 'wk_1', false), 'local');
  const before = one.state;
  one.reconcile();
  checkTrue('unchanged collection returns the same state object', before === one.state);

  let result = await one.flush();
  check('flush pushes both rows', [result.pushed, result.failed, pendingCount(one.state)], [2, 0, 0]);
  check('remote holds the rows', remote.count(), 2);
  check('status is synced after flush', statusFor(one.state, 'workouts', 'wk_1', true), 'synced');
  check('remote row content matches the mapper', (remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow).title, 'Push Day');

  one.edit('wk_1', { title: 'Push Day (edited)', updatedAt: '2026-10-11T09:05:00.000Z' });
  check('edit queues one upsert', one.state.outbox.map((e) => e.clientId), ['wk_1']);
  check('edited item is pending', statusFor(one.state, 'workouts', 'wk_1', true), 'pending');
  check('untouched item stays synced', statusFor(one.state, 'workouts', 'wk_2', true), 'synced');
  await one.flush();
  check('edit reaches the remote', (remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow).title, 'Push Day (edited)');

  one.remove('wk_2');
  check('local delete of a synced item queues a delete', one.state.outbox.map((e) => [e.clientId, e.op]), [['wk_2', 'delete']]);
  result = await one.flush();
  check('delete becomes a tombstone, not a hard delete', [result.deleted, remote.count(), Boolean(remote.get('workouts', USER, 'wk_2')?.deleted_at)], [1, 1, true]);

  one.add(makeWorkout({ id: 'wk_3', title: 'Legs' }));
  one.remove('wk_3');
  check('create then delete before a flush leaves nothing queued', pendingCount(one.state), 0);

  suite('sync: failures');
  one.add(makeWorkout({ id: 'wk_4', title: 'Arms' }));
  remote.failNext = new Error('network down');
  result = await one.flush();
  check('failure is counted and the entry stays', [result.failed, pendingCount(one.state)], [1, 1]);
  check('failed entry records the attempt', [one.state.outbox[0].attempts, one.state.outbox[0].lastError], [1, 'network down']);
  check('status shows error', statusFor(one.state, 'workouts', 'wk_4', true), 'error');
  result = await one.flush(true);
  check('automatic (fresh-only) flush skips failed entries', [result.pushed, result.failed, pendingCount(one.state)], [0, 0, 1]);
  one.add(makeWorkout({ id: 'wk_5', title: 'Core' }));
  result = await one.flush(true);
  check('fresh-only flush still pushes new changes', [result.pushed, remote.get('workouts', USER, 'wk_5') !== undefined], [1, true]);
  result = await one.flush();
  check('a full flush retries the failed entry', [result.pushed, pendingCount(one.state)], [1, 0]);

  suite('sync: pull and merge');
  clock = new Date('2026-10-11T10:00:00.000Z');
  remote.seed('workouts', workoutToRow(USER, makeWorkout({ id: 'wk_phone', title: 'From the other phone' })) as never);
  let pull = await one.pull();
  check('unknown remote item is inserted', pull.applied, ['wk_phone']);
  check('inserted item is synced, not re-queued', [statusFor(one.state, 'workouts', 'wk_phone', true), pendingCount(one.state)], ['synced', 0]);
  check('the reconcile pass confirms the pulled item landed', trackedItem(one.state, 'workouts', 'wk_phone')?.awaitingLocal, undefined);
  checkTrue('lastPulledAt advances', Boolean(one.state.lastPulledAt.workouts));
  pull = await one.pull();
  check('second pull applies nothing', pull.applied, []);

  clock = new Date('2026-10-11T11:00:00.000Z');
  const serverEdit = { ...(remote.get('workouts', USER, 'wk_4') as unknown as WorkoutRow), title: 'Arms (edited on web)' };
  remote.seed('workouts', serverEdit as never);
  await one.pull();
  check('newer server version replaces an unchanged local item', one.workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (edited on web)');
  check('and nothing is echoed back', pendingCount(one.state), 0);

  one.edit('wk_4', { title: 'Arms (edited on phone)', updatedAt: '2026-10-11T12:00:00.000Z' });
  clock = new Date('2026-10-11T11:30:00.000Z');
  remote.seed('workouts', { ...serverEdit, title: 'Arms (older server edit)' } as never);
  await one.pull();
  check('local wins when its edit is newer', one.workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (edited on phone)');
  check('local winner stays queued for push', statusFor(one.state, 'workouts', 'wk_4', true), 'pending');

  clock = new Date('2026-10-11T13:00:00.000Z');
  remote.seed('workouts', { ...serverEdit, title: 'Arms (newest server edit)' } as never);
  await one.pull();
  check('server wins when its edit is newer', one.workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (newest server edit)');
  check('server winner clears the queue', pendingCount(one.state), 0);

  suite('sync: tombstones across devices');
  const two = new Device(remote);
  await two.pull(true);
  check('device 2 starts with every live item', two.ids(), one.ids());

  one.remove('wk_4');
  clock = new Date('2026-10-11T14:00:00.000Z');
  result = await one.flush();
  check('device 1 delete becomes a tombstone', [result.deleted, Boolean(remote.get('workouts', USER, 'wk_4')?.deleted_at)], [1, true]);

  pull = await two.pull();
  check('device 2 removes the tombstoned item', [pull.removed, two.workouts.some((w) => w.id === 'wk_4')], [['wk_4'], false]);
  check('device 2 has nothing queued after the removal', pendingCount(two.state), 0);

  one.remove('wk_phone');
  clock = new Date('2026-10-11T15:00:00.000Z');
  await one.flush();
  two.edit('wk_phone', { title: 'Edited after delete', updatedAt: '2026-10-11T16:00:00.000Z' });
  pull = await two.pull();
  check('a newer local edit survives a tombstone', [pull.removed, two.workouts.find((w) => w.id === 'wk_phone')?.title], [[], 'Edited after delete']);
  clock = new Date('2026-10-11T16:30:00.000Z');
  result = await two.flush();
  check('the re-push clears the tombstone on the server', [result.pushed, remote.get('workouts', USER, 'wk_phone')?.deleted_at ?? null], [1, null]);

  const before2 = two.workouts;
  two.remove('wk_phone');
  check('the pending delete is queued', two.state.outbox.map((e) => [e.clientId, e.op]), [['wk_phone', 'delete']]);
  const applied = applyRemoteRows(two.state, 'workouts', [remote.get('workouts', USER, 'wk_phone') as never], two.workouts, (row) => rowToWorkout(row as never));
  check('locally deleted item is not resurrected by a pull', applied.items.some((w) => w.id === 'wk_phone'), false);
  two.workouts = before2;
  two.reconcile();

  suite('sync: app closed mid-sync never loses or resurrects data');
  // A fresh device pulls, but the app closes before the merged records are saved.
  const three = new Device(remote);
  pull = await three.pullAndCrash(true);
  checkTrue('the pull applied items', pull.applied.length > 0);
  three.reconcile(); // relaunch: collection is still empty
  check('missing pulled items are not read as deletes', three.state.outbox.filter((e) => e.op === 'delete').length, 0);
  check('the pull cursor is cleared so they are fetched again', three.state.lastPulledAt.workouts, undefined);
  await three.pull();
  check('the next sync brings them back', three.ids(), two.ids());
  check('and the device is quiet afterwards', pendingCount(three.state), 0);
  const serverCountBefore = remote.count();
  await three.flush();
  check('nothing was deleted on the server', remote.count(), serverCountBefore);

  // An existing item is updated on the server; the device pulls it but the app closes before saving.
  clock = new Date('2026-10-11T17:00:00.000Z');
  remote.seed('workouts', { ...(remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow), title: 'Push Day v3' } as never);
  await three.pullAndCrash();
  three.reconcile(); // relaunch with the older copy
  check('an older local copy is not pushed over the newer server version', pendingCount(three.state), 0);
  await three.pull();
  check('the newer version arrives on the next sync', three.workouts.find((w) => w.id === 'wk_1')?.title, 'Push Day v3');
  check('server still has the newer version', (remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow).title, 'Push Day v3');

  // A tombstone is pulled but the app closes before the local removal is saved.
  one.workouts = one.workouts.filter((w) => w.id !== 'wk_5');
  await one.pull();
  one.reconcile();
  clock = new Date('2026-10-11T18:00:00.000Z');
  await one.flush();
  checkTrue('wk_5 is tombstoned on the server', Boolean(remote.get('workouts', USER, 'wk_5')?.deleted_at));
  await three.pullAndCrash();
  three.reconcile(); // relaunch with wk_5 still present
  check('a deleted item is not resurrected by the older local copy', [pendingCount(three.state), Boolean(remote.get('workouts', USER, 'wk_5')?.deleted_at)], [0, true]);
  await three.pull();
  check('the removal lands on the next sync', three.workouts.some((w) => w.id === 'wk_5'), false);
  check('and the device is quiet afterwards', pendingCount(three.state), 0);

  // Derived collections can opt out of re-pulling rows that can never land.
  const derived = reconcileCollection(
    { ...emptySyncState(), lastPulledAt: { run_routes: '2026-10-11T00:00:00Z' }, tracking: { run_routes: { orphan: { fp: 'x', syncedFp: 'x', awaitingLocal: true } } } },
    'run_routes',
    [],
    NOW,
    { repull: false }
  );
  check('repull: false drops an orphan without resetting the cursor', [derived.tracking.run_routes?.orphan, derived.lastPulledAt.run_routes, derived.outbox.length], [undefined, '2026-10-11T00:00:00Z', 0]);
}
