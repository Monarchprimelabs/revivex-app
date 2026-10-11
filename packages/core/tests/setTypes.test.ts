import { check, suite } from '@revivex/test-utils';
import type { Workout } from '../src/types';
import { getWorkoutVolume } from '../src/utils/progress';
import { getPRHistory } from '../src/utils/prHistory';
import { isWorkingSet, nextSetType } from '../src/utils/setTypes';

export function runSetTypeTests(): void {
  suite('setTypes');
  check('cycle order', [nextSetType(undefined), nextSetType('warmup'), nextSetType('drop'), nextSetType('failure')], ['warmup', 'drop', 'failure', 'normal']);
  check('warm-ups are not working sets', [isWorkingSet({ setType: 'warmup' }), isWorkingSet({}), isWorkingSet({ setType: 'drop' })], [false, true, true]);
  const workout: Workout = {
    id: 'wk',
    title: 'Bench',
    date: '2026-10-10T17:00:00.000Z',
    duration: 1800,
    exercises: [
      {
        id: 'e1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { id: 's1', setNumber: 1, weight: 95, reps: 10, completed: true, setType: 'warmup' },
          { id: 's2', setNumber: 2, weight: 185, reps: 5, completed: true },
          { id: 's3', setNumber: 3, weight: 185, reps: 5, completed: true, setType: 'failure' },
        ],
      },
    ],
    totalSets: 3,
    totalVolume: 0,
  };
  check('volume excludes warm-ups', getWorkoutVolume(workout), 185 * 5 * 2);
  const pr = getPRHistory([workout]);
  check('records ignore the warm-up weight', pr.events.every((event) => event.weight === 185), true);
}
