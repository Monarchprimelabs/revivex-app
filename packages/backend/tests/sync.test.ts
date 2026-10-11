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
  workoutToRow,
  type SyncState,
  type WorkoutRow,
} from '../src';
import { makeWorkout } from './fixtures';

const USER = 'user_1';
const NOW = '2026-10-11T09:00:00.000Z';

function deps(remote: InMemoryRemoteStore, collection: () => Workout[]) {
  return {
    remote,
    userId: USER,
    getLocal: (_table: string, clientId: string) => collection().find((w) => w.id === clientId),
    toRow: (_table: string, userId: string, item: unknown) => workoutToRow(userId, item as Workout),
  };
}

export async function runSyncTests(): Promise<void> {
  suite('sync: reconcile and flush');
  let clock = new Date('2026-10-11T09:00:00.000Z');
  const remote = new InMemoryRemoteStore(() => clock);
  let workouts: Workout[] = [makeWorkout(), makeWorkout({ id: 'wk_2', title: 'Pull Day' })];
  let state: SyncState = reconcileCollection(emptySyncState(), 'workouts', workouts, NOW);
  check('new items are queued as upserts', state.outbox.map((e) => [e.clientId, e.op]), [['wk_1', 'upsert'], ['wk_2', 'upsert']]);
  check('status is pending before flush', statusFor(state, 'workouts', 'wk_1', true), 'pending');
  check('status is local when cloud is inactive', statusFor(state, 'workouts', 'wk_1', false), 'local');
  const same = reconcileCollection(state, 'workouts', workouts, NOW);
  checkTrue('unchanged collection returns the same state object', same === state);

  let result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('flush pushes both rows', [result.pushed, result.failed, pendingCount(state)], [2, 0, 0]);
  check('remote holds the rows', remote.count(), 2);
  check('status is synced after flush', statusFor(state, 'workouts', 'wk_1', true), 'synced');
  check('remote row content matches the mapper', (remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow).title, 'Push Day');

  workouts = workouts.map((w) => (w.id === 'wk_1' ? { ...w, title: 'Push Day (edited)', updatedAt: '2026-10-11T09:05:00.000Z' } : w));
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  check('edit queues one upsert', state.outbox.map((e) => e.clientId), ['wk_1']);
  check('edited item is pending', statusFor(state, 'workouts', 'wk_1', true), 'pending');
  check('untouched item stays synced', statusFor(state, 'workouts', 'wk_2', true), 'synced');
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('edit reaches the remote', (remote.get('workouts', USER, 'wk_1') as unknown as WorkoutRow).title, 'Push Day (edited)');

  workouts = workouts.filter((w) => w.id !== 'wk_2');
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  check('local delete of a synced item queues a delete', state.outbox.map((e) => [e.clientId, e.op]), [['wk_2', 'delete']]);
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('delete reaches the remote', [result.deleted, remote.count()], [1, 1]);

  workouts = [...workouts, makeWorkout({ id: 'wk_3', title: 'Legs' })];
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  workouts = workouts.filter((w) => w.id !== 'wk_3');
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  check('create then delete before a flush leaves nothing queued', pendingCount(state), 0);

  suite('sync: failures');
  workouts = [...workouts, makeWorkout({ id: 'wk_4', title: 'Arms' })];
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  remote.failNext = new Error('network down');
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('failure is counted and the entry stays', [result.failed, pendingCount(state)], [1, 1]);
  check('failed entry records the attempt', [state.outbox[0].attempts, state.outbox[0].lastError], [1, 'network down']);
  check('status shows error', statusFor(state, 'workouts', 'wk_4', true), 'error');
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('retry succeeds', [result.pushed, pendingCount(state)], [1, 0]);

  suite('sync: pull and merge');
  clock = new Date('2026-10-11T10:00:00.000Z');
  const otherDeviceRow = workoutToRow(USER, makeWorkout({ id: 'wk_phone', title: 'From the other phone' }));
  remote.seed('workouts', otherDeviceRow as never);
  let pull = await pullTable(state, 'workouts', { remote, userId: USER, local: workouts, fromRow: (row) => rowToWorkout(row as never) });
  state = pull.state;
  workouts = pull.items;
  check('unknown remote item is inserted', pull.applied, ['wk_phone']);
  check('inserted item is synced, not re-queued', [statusFor(state, 'workouts', 'wk_phone', true), pendingCount(state)], ['synced', 0]);
  checkTrue('lastPulledAt advances', Boolean(state.lastPulledAt.workouts));

  pull = await pullTable(state, 'workouts', { remote, userId: USER, local: workouts, fromRow: (row) => rowToWorkout(row as never) });
  check('second pull applies nothing', pull.applied, []);
  state = pull.state;

  clock = new Date('2026-10-11T11:00:00.000Z');
  const serverEdit = { ...(remote.get('workouts', USER, 'wk_4') as unknown as WorkoutRow), title: 'Arms (edited on web)' };
  remote.seed('workouts', serverEdit as never);
  pull = await pullTable(state, 'workouts', { remote, userId: USER, local: workouts, fromRow: (row) => rowToWorkout(row as never) });
  state = pull.state;
  workouts = pull.items;
  check('newer server version replaces an unchanged local item', workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (edited on web)');

  // Conflict: local edited after the server edit -> local wins.
  workouts = workouts.map((w) => (w.id === 'wk_4' ? { ...w, title: 'Arms (edited on phone)', updatedAt: '2026-10-11T12:00:00.000Z' } : w));
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  clock = new Date('2026-10-11T11:30:00.000Z');
  remote.seed('workouts', { ...serverEdit, title: 'Arms (older server edit)' } as never);
  pull = await pullTable(state, 'workouts', { remote, userId: USER, local: workouts, fromRow: (row) => rowToWorkout(row as never) });
  state = pull.state;
  workouts = pull.items;
  check('local wins when its edit is newer', workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (edited on phone)');
  check('local winner stays queued for push', statusFor(state, 'workouts', 'wk_4', true), 'pending');

  // Conflict: server edited after the local edit -> server wins.
  clock = new Date('2026-10-11T13:00:00.000Z');
  remote.seed('workouts', { ...serverEdit, title: 'Arms (newest server edit)' } as never);
  pull = await pullTable(state, 'workouts', { remote, userId: USER, local: workouts, fromRow: (row) => rowToWorkout(row as never) });
  state = pull.state;
  workouts = pull.items;
  check('server wins when its edit is newer', workouts.find((w) => w.id === 'wk_4')?.title, 'Arms (newest server edit)');
  check('server winner clears the queue', pendingCount(state), 0);

  suite('sync: tombstones across devices');
  // Device 2 holds the same items and tracking as device 1 after a full pull.
  const device2 = await pullTable<Workout>(emptySyncState(), 'workouts', { remote, userId: USER, local: [], fromRow: (row) => rowToWorkout(row as never), full: true });
  let state2 = device2.state;
  let workouts2 = device2.items;
  check('device 2 starts with every live item', workouts2.map((w) => w.id).sort(), workouts.map((w) => w.id).sort());

  // Device 1 deletes wk_4 and pushes.
  workouts = workouts.filter((w) => w.id !== 'wk_4');
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  clock = new Date('2026-10-11T14:00:00.000Z');
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  check('delete becomes a tombstone, not a hard delete', [result.deleted, remote.count(), Boolean(remote.get('workouts', USER, 'wk_4')?.deleted_at)], [1, 2, true]);

  // Device 2 pulls and drops it.
  let pull2 = await pullTable<Workout>(state2, 'workouts', { remote, userId: USER, local: workouts2, fromRow: (row) => rowToWorkout(row as never) });
  state2 = pull2.state;
  workouts2 = pull2.items;
  check('device 2 removes the tombstoned item', [pull2.removed, workouts2.some((w) => w.id === 'wk_4')], [['wk_4'], false]);
  check('device 2 has nothing queued after the removal', pendingCount(reconcileCollection(state2, 'workouts', workouts2, NOW)), 0);

  // Device 2 edits wk_phone after device 1 deletes it: the edit wins and resurrects it.
  workouts = workouts.filter((w) => w.id !== 'wk_phone');
  state = reconcileCollection(state, 'workouts', workouts, NOW);
  clock = new Date('2026-10-11T15:00:00.000Z');
  result = await flushOutbox(state, deps(remote, () => workouts));
  state = result.state;
  workouts2 = workouts2.map((w) => (w.id === 'wk_phone' ? { ...w, title: 'Edited after delete', updatedAt: '2026-10-11T16:00:00.000Z' } : w));
  state2 = reconcileCollection(state2, 'workouts', workouts2, NOW);
  pull2 = await pullTable<Workout>(state2, 'workouts', { remote, userId: USER, local: workouts2, fromRow: (row) => rowToWorkout(row as never) });
  state2 = pull2.state;
  workouts2 = pull2.items;
  check('a newer local edit survives a tombstone', [pull2.removed, workouts2.find((w) => w.id === 'wk_phone')?.title], [[], 'Edited after delete']);
  clock = new Date('2026-10-11T16:30:00.000Z');
  result = await flushOutbox(state2, deps(remote, () => workouts2));
  state2 = result.state;
  check('the re-push clears the tombstone on the server', [result.pushed, remote.get('workouts', USER, 'wk_phone')?.deleted_at ?? null], [1, null]);

  // A delete that is still queued (not yet pushed) blocks a re-insert from the server.
  const scratchWorkouts = workouts2.filter((w) => w.id !== 'wk_phone');
  const scratchState = reconcileCollection(state2, 'workouts', scratchWorkouts, NOW);
  check('the pending delete is queued', scratchState.outbox.map((e) => [e.clientId, e.op]), [['wk_phone', 'delete']]);
  const applied = applyRemoteRows(scratchState, 'workouts', [remote.get('workouts', USER, 'wk_phone') as never], scratchWorkouts, (row) => rowToWorkout(row as never));
  check('locally deleted item is not resurrected by a pull', applied.items.some((w) => w.id === 'wk_phone'), false);
}
