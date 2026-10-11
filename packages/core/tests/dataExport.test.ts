import { check, suite } from '@revivex/test-utils';
import type { Run, Workout } from '../src/types';
import { buildExport, parseReviveXExport } from '../src/utils/dataExport';

const workout: Workout = {
  id: 'wk_1',
  title: 'Push',
  date: '2026-10-10T17:00:00.000Z',
  duration: 3600,
  exercises: [{ id: 'e1', exerciseId: 'bench-press', exerciseName: 'Bench Press', muscleGroup: 'Chest', sets: [{ id: 's1', setNumber: 1, weight: 185, reps: 8, completed: true }] }],
  totalSets: 1,
  totalVolume: 1480,
};

const run: Run = {
  id: 'run_1',
  title: 'Easy 5K',
  date: '2026-10-09T12:00:00.000Z',
  distance: 3.1,
  distanceUnit: 'mi',
  durationSeconds: 1680,
  runType: 'Easy Run',
  createdAt: '2026-10-09T12:30:00.000Z',
};

export function runDataExportTests(): void {
  suite('dataExport');
  const payload = buildExport({ profile: null, workouts: [workout], routines: [], runs: [run], hybridSessions: [], bodyWeight: [] });
  const parsed = parseReviveXExport(JSON.stringify(payload));
  check('an export round trips through the parser', parsed.ok && parsed.counts.workouts === 1 && parsed.counts.runs === 1, true);
  check('parsed workouts keep their ids', parsed.ok ? parsed.data.workouts[0].id : null, 'wk_1');
  check('garbage text is rejected', parseReviveXExport('not json').ok, false);
  check('other apps are rejected', parseReviveXExport({ app: 'Other', exportVersion: 1, data: {} }).ok, false);
  const messy = parseReviveXExport({ app: 'ReviveX', exportVersion: 1, exportedAt: 'x', data: { workouts: [{ id: 'bad' }, { ...workout, id: 'good' }], runs: 'nope' } });
  check('malformed records are dropped, not fatal', messy.ok ? [messy.counts.workouts, messy.counts.runs, messy.data.workouts[0].id] : null, [1, 0, 'good']);
}
