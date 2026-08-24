import { getAchievements, getWeeklyStreak } from '../src/utils/achievements';
import { exercise, run, set, workout } from './fixtures';
import { check, suite } from './helpers';

export function runAchievementsTests(): void {
  suite('achievements');

  const now = new Date('2026-08-19T12:00:00');

  // Sessions in 3 consecutive weeks (this week + two prior).
  const workouts = [
    workout('a', '2026-08-17T10:00:00', [exercise('bench-press', 'Bench Press', [set(100, 10)])]),
    workout('b', '2026-08-10T10:00:00', [exercise('bench-press', 'Bench Press', [set(100, 10)])]),
    workout('c', '2026-08-03T10:00:00', [exercise('bench-press', 'Bench Press', [set(100, 10)])]),
  ];
  check('3-week streak', getWeeklyStreak(workouts, [], [], now), 3);

  // Empty this week but active last week keeps the streak alive at 1.
  check('streak alive from last week', getWeeklyStreak(workouts.slice(1), [], [], now), 2);

  // No sessions at all = 0.
  check('no sessions no streak', getWeeklyStreak([], [], [], now), 0);

  // First session earns "First Rep" and progress is capped at 1.
  const result = getAchievements(workouts.slice(0, 1), [run('r', '2026-08-17T07:00:00', 6, 'mi')], [], now);
  const firstRep = result.achievements.find((a) => a.id === 'sessions_1');
  check('First Rep earned', firstRep?.earned, true);
  check('progress capped', firstRep?.progress, 1);
  const firstMiles = result.achievements.find((a) => a.id === 'miles_5');
  check('First Miles earned at 6mi', firstMiles?.earned, true);
  check('earnedCount counts earned', result.earnedCount >= 2, true);
}
