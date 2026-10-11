import { check, suite } from '@revivex/test-utils';
import type { BodyWeightEntry, DailyPlanRecord, ReadinessCheckin } from '@revivex/core';
import {
  bodyWeightToRow,
  dailyPlanToRow,
  hybridSessionToRow,
  readinessCheckinToRow,
  routineToRow,
  rowToBodyWeight,
  rowToDailyPlan,
  rowToHybridSession,
  rowToReadinessCheckin,
  rowToRoutine,
  rowToRun,
  rowToWorkout,
  runToRow,
  workoutToRow,
} from '../src';
import { makeHybrid, makeRoutine, makeRun, makeWorkout } from './fixtures';

const USER = 'user_1';
const STAMP = '2026-10-11T08:00:00.000Z';

export function runMapperTests(): void {
  suite('backend mappers');

  const workout = makeWorkout();
  const workoutRow = workoutToRow(USER, workout);
  check('workout row keyed by device id', [workoutRow.user_id, workoutRow.client_id], [USER, 'wk_1']);
  check('workout row carries nested exercises', workoutRow.exercises.length, 1);
  const workoutBack = rowToWorkout({ ...workoutRow, created_at: STAMP, updated_at: STAMP });
  check('workout round trips', { ...workoutBack, updatedAt: undefined }, { ...workout, updatedAt: undefined });
  check('workout gets server updatedAt', workoutBack.updatedAt, STAMP);
  check('null notes map back to undefined', rowToWorkout({ ...workoutRow, notes: null }).notes, undefined);

  const run = makeRun();
  const runRow = runToRow(USER, run);
  check('miles stored as meters', runRow.distance_m, 4988.97);
  const runBack = rowToRun({ ...runRow, created_at: run.createdAt, updated_at: STAMP });
  check('run round trips distance in the logged unit', [runBack.distance, runBack.distanceUnit], [3.1, 'mi']);
  check('run keeps type, source and duration', [runBack.runType, runBack.source, runBack.durationSeconds], ['Easy Run', 'manual', 1680]);
  check('empty splits map to undefined', runBack.splits, undefined);
  const kmRun = makeRun({ id: 'run_2', distance: 5, distanceUnit: 'km' });
  check('km round trips', rowToRun({ ...runToRow(USER, kmRun), created_at: STAMP }).distance, 5);

  const hybrid = makeHybrid();
  const hybridBack = rowToHybridSession({ ...hybridSessionToRow(USER, hybrid), created_at: hybrid.createdAt, updated_at: STAMP });
  check('hybrid round trips', { ...hybridBack, updatedAt: undefined }, { ...hybrid, updatedAt: undefined });

  const routine = makeRoutine();
  const routineBack = rowToRoutine({ ...routineToRow(USER, routine), created_at: routine.createdAt, updated_at: routine.updatedAt });
  check('routine round trips', routineBack, routine);

  const entry: BodyWeightEntry = { id: 'bw_1', date: '2026-10-05T07:00:00.000Z', weight: 182.4, unit: 'lb', createdAt: '2026-10-05T07:00:00.000Z' };
  check('body weight round trips', rowToBodyWeight({ ...bodyWeightToRow(USER, entry), created_at: entry.createdAt }), entry);

  const checkin: ReadinessCheckin = { id: 'ci_1', date: '2026-10-11', sleep: 4, soreness: 2, energy: 4, score: 78, createdAt: STAMP };
  const checkinBack = rowToReadinessCheckin({ ...readinessCheckinToRow(USER, checkin), created_at: STAMP, updated_at: STAMP });
  check('check-in round trips', { ...checkinBack, updatedAt: undefined }, checkin);

  const plan: DailyPlanRecord = {
    id: 'plan_1',
    date: '2026-10-11',
    kind: 'lift',
    title: 'Upper body',
    engineVersion: 'coach-0.1',
    checkinId: 'ci_1',
    plan: { blocks: [], rationale: ['because'] },
    status: 'completed',
    completedActivityKind: 'workout',
    completedActivityId: 'wk_9',
    completedAt: STAMP,
    createdAt: STAMP,
  };
  const planRow = dailyPlanToRow(USER, plan);
  check('plan row uses device ids for links', [planRow.checkin_client_id, planRow.completed_activity_client_id], ['ci_1', 'wk_9']);
  check('plan round trips', { ...rowToDailyPlan({ ...planRow, created_at: STAMP, updated_at: STAMP }), updatedAt: undefined }, plan);
}
