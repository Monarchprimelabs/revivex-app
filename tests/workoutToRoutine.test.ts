import { workoutToRoutineInput } from '../src/utils/workoutToRoutine';
import { exercise, set, workout } from './fixtures';
import { check, suite } from './helpers';

export function runWorkoutToRoutineTests(): void {
  suite('workoutToRoutine');

  const source = workout(
    'w1',
    '2026-08-15T10:00:00',
    [
      exercise('bench-press', 'Bench Press', [set(185, 8), set(185, 8), set(205, 5)], 120),
      exercise('empty', 'Empty Exercise', []),
    ],
    'Push Day'
  );

  const routine = workoutToRoutineInput(source);
  check('routine name', routine.name, 'Push Day');
  check('empty exercises dropped', routine.exercises.length, 1);

  const bench = routine.exercises[0];
  check('target sets counts all', bench.targetSets, 3);
  check('target reps = most common', bench.targetReps, 8);
  check('target weight = heaviest', bench.targetWeight, 205);
  check('rest carried over', bench.restSeconds, 120);
}
