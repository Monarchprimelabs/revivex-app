import { getWeekRange, getWeeklyDelta, getWeeklySummary } from '../src/utils/weeklySummary';
import { exercise, run, set, workout } from './fixtures';
import { check, checkClose, suite } from './helpers';

export function runWeeklySummaryTests(): void {
  suite('weeklySummary');

  // Fixed clock: Wednesday 2026-08-19. Week = Sun 08-16 .. Sat 08-22.
  const now = new Date('2026-08-19T12:00:00');
  const range = getWeekRange(now, 0);
  check('week starts Sunday', range.start.getDay(), 0);
  check('week start date', range.start.getDate(), 16);

  const workouts = [
    workout('w1', '2026-08-17T10:00:00', [exercise('bench-press', 'Bench Press', [set(100, 10)])]),
    workout('w2', '2026-08-10T10:00:00', [exercise('bench-press', 'Bench Press', [set(100, 10)])]), // last week
  ];
  const runs = [
    run('r1', '2026-08-18T07:00:00', 5, 'km'),
    run('r2', '2026-08-17T07:00:00', 2, 'mi'), // same day as w1
  ];

  const summary = getWeeklySummary(workouts, runs, [], range);
  check('sessions this week', summary.sessions, 3);
  check('strength workouts', summary.strengthWorkouts, 1);
  check('runs', summary.runs, 2);
  checkClose('run miles (5km + 2mi)', summary.runDistanceMiles, 5 * 0.621371 + 2, 0.01);
  check('active days dedupes same-day', summary.activeDays, 2);

  // Delta math.
  check('delta flat', getWeeklyDelta(5, 5), { direction: 'flat' });
  check('delta up 50%', getWeeklyDelta(3, 2), { direction: 'up', percent: 50 });
  check('delta down 50%', getWeeklyDelta(1, 2), { direction: 'down', percent: 50 });
  check('delta from zero has no percent', getWeeklyDelta(4, 0), { direction: 'up' });
}
