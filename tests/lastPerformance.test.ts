import { formatLastPerformance, getLastPerformance } from '../src/utils/lastPerformance';
import { exercise, set, workout } from './fixtures';
import { check, suite } from './helpers';

export function runLastPerformanceTests(): void {
  suite('lastPerformance');

  const history = [
    workout('old', '2026-08-01T10:00:00', [
      exercise('bench-press', 'Bench Press', [set(185, 8), set(185, 8)]),
    ]),
    workout('new', '2026-08-15T10:00:00', [
      exercise('bench-press', 'Bench Press', [set(190, 8), set(205, 5)]),
    ]),
  ];

  const last = getLastPerformance(history, 'bench-press');
  check('picks most recent workout', last?.workoutId, 'new');
  check('keeps set order', last?.sets, [
    { weight: 190, reps: 8 },
    { weight: 205, reps: 5 },
  ]);
  check('format', formatLastPerformance(last!), '190×8, 205×5');

  // Unknown exercise → undefined.
  check('unknown key', getLastPerformance(history, 'nope'), undefined);

  // Incomplete sets are skipped when completed ones exist.
  const mixed = [
    workout('m', '2026-08-16T10:00:00', [
      exercise('squat', 'Squat', [set(225, 5, true), set(245, 1, false)]),
    ]),
  ];
  check('incomplete sets skipped', getLastPerformance(mixed, 'squat')?.sets, [
    { weight: 225, reps: 5 },
  ]);
}
