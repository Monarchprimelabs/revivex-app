import { check, checkTrue, suite } from '@revivex/test-utils';
import type { HybridSession, Run, Workout } from '@revivex/core';
import {
  assessReadiness,
  generateDayPlan,
  planToHybridSession,
  planToRun,
  planToWorkout,
  readinessScore,
  roundToIncrement,
  shortenPlan,
  startOfWeek,
  suggestLoad,
  swapExercise,
  weekTemplateFor,
  type CoachProfile,
  type StrengthBlock,
} from '../src';

// Wednesday 2026-10-14, noon local time. The week starts Monday 2026-10-12.
const TODAY = new Date(2026, 9, 14, 12, 0, 0);

const profile: CoachProfile = {
  trainingFocus: 'Hybrid',
  primaryGoal: 'Build Strength',
  experienceLevel: 'Intermediate',
  weeklyTrainingTarget: 4,
  preferredWeightUnit: 'lb',
  preferredDistanceUnit: 'mi',
};

function workout(id: string, date: Date, exerciseId: string, muscleGroup: Workout['exercises'][number]['muscleGroup'], weight: number, reps: number[], exerciseName = exerciseId): Workout {
  return {
    id,
    title: id,
    date: date.toISOString(),
    duration: 3600,
    exercises: [
      {
        id: `${id}_e1`,
        exerciseId,
        exerciseName,
        muscleGroup,
        sets: reps.map((r, i) => ({ id: `${id}_s${i}`, setNumber: i + 1, weight, reps: r, completed: true })),
      },
    ],
    totalSets: reps.length,
    totalVolume: reps.reduce((sum, r) => sum + r * weight, 0),
  };
}

function run(id: string, date: Date, miles: number, seconds: number, runType: Run['runType'] = 'Easy Run'): Run {
  return { id, title: id, date: date.toISOString(), distance: miles, distanceUnit: 'mi', durationSeconds: seconds, runType, createdAt: date.toISOString() };
}

const empty = { workouts: [] as Workout[], runs: [] as Run[], hybridSessions: [] as HybridSession[] };

export function runCoachTests(): void {
  suite('coach: readiness');
  check('best case scores 100', readinessScore({ sleep: 5, soreness: 1, energy: 5 }), 100);
  check('worst case scores 0', readinessScore({ sleep: 1, soreness: 5, energy: 1 }), 0);
  check('middle scores 50', readinessScore({ sleep: 3, soreness: 3, energy: 3 }), 50);
  check('bands', [assessReadiness({ sleep: 1, soreness: 5, energy: 2 }).band, assessReadiness({ sleep: 3, soreness: 3, energy: 3 }).band, assessReadiness({ sleep: 4, soreness: 2, energy: 4 }).band], ['low', 'moderate', 'high']);
  check('moderate scales volume to 0.7', assessReadiness({ sleep: 3, soreness: 3, energy: 3 }).volumeScale, 0.7);

  suite('coach: week templates');
  check('lift at 3 is push pull legs', weekTemplateFor('Lift', 3), ['push', 'pull', 'legs']);
  check('hybrid at 4 alternates lift, run, lift, hybrid', weekTemplateFor('Hybrid', 4), ['upper', 'run_easy', 'lower', 'hybrid']);
  check('run at 3 is easy, quality, long', weekTemplateFor('Run', 3), ['run_easy', 'run_quality', 'run_long']);
  check('targets are clamped to 2..6', [weekTemplateFor('Lift', 1).length, weekTemplateFor('Lift', 9).length], [2, 6]);
  check('week starts on Monday', startOfWeek(TODAY).getDay(), 1);

  suite('coach: slot selection');
  const fresh = generateDayPlan({ profile, history: empty, date: TODAY });
  check('no history starts at the first slot', [fresh.kind, fresh.slot, fresh.completedThisWeek], ['lift', 'upper', 0]);
  check('plan date is local YYYY-MM-DD', fresh.date, '2026-10-14');
  check('upper day has five exercises', fresh.blocks.length, 5);
  checkTrue('first block is a compound chest movement', (fresh.blocks[0] as StrengthBlock).exerciseId === 'bench-press');
  checkTrue('new movements have no target weight', (fresh.blocks[0] as StrengthBlock).targetWeight === undefined);
  checkTrue('rationale explains the week', fresh.rationale[0].includes('4 sessions'));
  check('engine version is stamped', fresh.engineVersion, 'coach-0.1.0');

  const mondayUpper = workout('wk_mon', new Date(2026, 9, 12, 18), 'bench-press', 'Chest', 185, [5, 5, 5, 5], 'Bench Press');
  const afterOne = generateDayPlan({ profile, history: { ...empty, workouts: [mondayUpper] }, date: TODAY });
  check('one session done moves to the run slot', [afterOne.kind, afterOne.slot, afterOne.completedThisWeek], ['run', 'run_easy', 1]);
  check('run with no history uses the experience default', (afterOne.blocks[0] as { distance: number }).distance, 2.5);

  const tuesdayRun = run('run_tue', new Date(2026, 9, 13, 7), 3, 1800);
  const afterTwo = generateDayPlan({ profile, history: { ...empty, workouts: [mondayUpper], runs: [tuesdayRun] }, date: TODAY });
  check('two sessions done moves to lower', [afterTwo.kind, afterTwo.slot], ['lift', 'lower']);

  const lowerYesterday = workout('wk_tue_legs', new Date(2026, 9, 13, 18), 'barbell-back-squat', 'Quads', 225, [5, 5, 5, 5, 5, 5], 'Back Squat');
  const fatigued = generateDayPlan({ profile, history: { ...empty, workouts: [mondayUpper, lowerYesterday] }, date: TODAY });
  check('fatigued lower slot is skipped for the next slot', [fatigued.kind, fatigued.slot], ['hybrid', 'hybrid']);
  checkTrue('skip is explained', fatigued.rationale.some((line) => line.includes('skipped')));

  const full = generateDayPlan({
    profile,
    history: { workouts: [mondayUpper, lowerYesterday], runs: [tuesdayRun], hybridSessions: [{ id: 'hy', title: 'Hybrid', date: new Date(2026, 9, 14, 8).toISOString(), sessionType: 'Hybrid Benchmark', totalDurationSeconds: 2400, segments: [], createdAt: '' }] },
    date: TODAY,
  });
  check('target reached becomes recovery', [full.kind, full.blocks.length], ['recovery', 2]);

  suite('coach: readiness gates');
  const low = generateDayPlan({ profile, history: empty, readiness: { sleep: 1, soreness: 5, energy: 1 }, date: TODAY });
  check('low readiness with no recent session is active recovery', low.kind, 'recovery');
  const lowAfter = generateDayPlan({ profile, history: { ...empty, workouts: [lowerYesterday] }, readiness: { sleep: 1, soreness: 5, energy: 1 }, date: TODAY });
  check('low readiness right after a session is a rest day', [lowAfter.kind, lowAfter.blocks.length], ['rest', 0]);
  const moderate = generateDayPlan({ profile, history: { ...empty, workouts: [mondayUpper] }, readiness: { sleep: 3, soreness: 3, energy: 3 }, date: new Date(2026, 9, 16, 12) });
  check('moderate readiness on a lift day trims sets', (generateDayPlan({ profile, history: empty, readiness: { sleep: 3, soreness: 3, energy: 3 }, date: TODAY }).blocks[0] as StrengthBlock).sets, 3);
  check('moderate readiness keeps the plan kind', moderate.kind, 'run');

  suite('coach: progressive overload');
  const history = [workout('wk_a', new Date(2026, 9, 7, 18), 'bench-press', 'Chest', 185, [5, 5, 5, 5], 'Bench Press')];
  const up = suggestLoad('bench-press', 'Chest', 5, history, 'lb', undefined);
  check('all reps hit adds 2.5 percent on upper body, rounded to 2.5 lb', [up.targetWeight, up.increased], [190, true]);
  const squatHistory = [workout('wk_b', new Date(2026, 9, 7, 18), 'barbell-back-squat', 'Quads', 225, [5, 5, 5, 5], 'Back Squat')];
  check('lower body adds 5 percent', suggestLoad('barbell-back-squat', 'Quads', 5, squatHistory, 'lb', undefined).targetWeight, 237.5);
  const missed = [workout('wk_c', new Date(2026, 9, 7, 18), 'bench-press', 'Chest', 185, [5, 5, 4, 3], 'Bench Press')];
  check('missed reps hold the load', [suggestLoad('bench-press', 'Chest', 5, missed, 'lb', undefined).targetWeight, suggestLoad('bench-press', 'Chest', 5, missed, 'lb', undefined).increased], [185, false]);
  check('moderate readiness never increases', suggestLoad('bench-press', 'Chest', 5, history, 'lb', assessReadiness({ sleep: 3, soreness: 3, energy: 3 })).targetWeight, 185);
  check('kg rounds to 1.25', roundToIncrement(101.1, 'kg'), 101.25);
  check('bodyweight history gives rep guidance only', suggestLoad('pull-up', 'Back', 8, [workout('wk_d', new Date(2026, 9, 7), 'pull-up', 'Back', 0, [8, 7, 6], 'Pull-Up')], 'lb', undefined).targetWeight, undefined);
  const planned = generateDayPlan({ profile, history: { ...empty, workouts: history }, date: TODAY });
  check('frequently used exercise is selected and progressed', [(planned.blocks[0] as StrengthBlock).exerciseName, (planned.blocks[0] as StrengthBlock).targetWeight], ['Bench Press', 190]);
  checkTrue('progression shows up in the rationale', planned.rationale.some((line) => line.includes('Bench Press moves up to 190 lb')));

  suite('coach: running');
  const runProfile: CoachProfile = { ...profile, trainingFocus: 'Run', weeklyTrainingTarget: 3 };
  const lastWeek = [run('r1', new Date(2026, 9, 6, 7), 4, 2400), run('r2', new Date(2026, 9, 8, 7), 3, 1740), run('r3', new Date(2026, 9, 10, 7), 8, 5280)];
  const easy = generateDayPlan({ profile: runProfile, history: { ...empty, runs: lastWeek }, date: TODAY });
  check('easy run is a quarter of weekly volume', [easy.slot, (easy.blocks[0] as { distance: number }).distance], ['run_easy', 3.8]);
  checkTrue('easy pace is slower than recent average', ((easy.blocks[0] as { targetPaceSeconds?: number }).targetPaceSeconds ?? 0) > 600);
  const quality = generateDayPlan({ profile: runProfile, history: { ...empty, runs: [...lastWeek, run('r4', new Date(2026, 9, 12, 7), 3, 1800)] }, date: TODAY });
  check('second slot is a tempo run', [quality.slot, (quality.blocks[0] as { runType: string }).runType], ['run_quality', 'Tempo']);
  const afterHard = generateDayPlan({ profile: runProfile, history: { ...empty, runs: [...lastWeek, run('r4', new Date(2026, 9, 13, 7), 4, 1900, 'Tempo')] }, date: TODAY });
  check('hard run within 48h turns quality into easy', afterHard.slot, 'run_easy');

  suite('coach: determinism and conversion');
  const a = generateDayPlan({ profile, history: { ...empty, workouts: history }, readiness: { sleep: 4, soreness: 2, energy: 4 }, date: TODAY });
  const b = generateDayPlan({ profile, history: { ...empty, workouts: history }, readiness: { sleep: 4, soreness: 2, energy: 4 }, date: TODAY });
  check('same input gives the same plan', a, b);
  const asWorkout = planToWorkout(a, { id: 'wk_done', performedAt: '2026-10-14T17:00:00.000Z' });
  check('completed lift becomes a workout with all sets', [asWorkout.exercises.length, asWorkout.totalSets], [5, a.blocks.reduce((sum, block) => sum + (block as StrengthBlock).sets, 0)]);
  check('workout volume counts loaded sets only', asWorkout.totalVolume, 190 * 5 * 4);
  const asRun = planToRun(easy, { id: 'run_done', performedAt: '2026-10-14T07:00:00.000Z', durationSeconds: 2280 });
  check('completed run keeps distance and computes pace', [asRun.distance, asRun.paceSecondsPerMile], [3.8, 600]);
  const hybridPlan = generateDayPlan({ profile, history: { ...empty, workouts: [mondayUpper, lowerYesterday] }, date: TODAY });
  const asHybrid = planToHybridSession(hybridPlan, { id: 'hy_done', durationSeconds: 2700 });
  check('completed hybrid expands the benchmark segments', [asHybrid.sessionType, asHybrid.segments.length], ['Hybrid Benchmark', 6]);
}

export function runAdjustTests(): void {
  suite('coach: adjustments');
  const basePlan = generateDayPlan({ profile, history: { ...empty, workouts: [workout('wk_a', new Date(2026, 9, 7, 18), 'bench-press', 'Chest', 185, [5, 5, 5, 5], 'Bench Press')] }, date: TODAY });
  const swapped = swapExercise(basePlan, 0, []);
  const before = basePlan.blocks[0] as StrengthBlock;
  const after = swapped.blocks[0] as StrengthBlock;
  checkTrue('swap picks a different exercise', after.exerciseId !== before.exerciseId);
  check('swap keeps the muscle group', after.muscleGroup, before.muscleGroup);
  checkTrue('swap never duplicates another block', !swapped.blocks.some((block, index) => index !== 0 && block.type === 'strength' && block.exerciseId === after.exerciseId));
  checkTrue('swap explains itself', swapped.rationale[swapped.rationale.length - 1].startsWith('Swapped Bench Press for'));
  check('swap on a non-strength block is a no-op', swapExercise(basePlan, 99, []), basePlan);

  const shorter = shortenPlan(basePlan);
  const setsBefore = basePlan.blocks.reduce((sum, block) => sum + (block as StrengthBlock).sets, 0);
  const setsAfter = shorter.blocks.reduce((sum, block) => sum + (block as StrengthBlock).sets, 0);
  checkTrue('shorten reduces total sets', setsAfter < setsBefore);
  checkTrue('shorten caps exercises at four', shorter.blocks.length <= 4);
  checkTrue('shorten reduces the estimate', shorter.estimatedMinutes < basePlan.estimatedMinutes);
  checkTrue('shorten keeps at least two sets', shorter.blocks.every((block) => (block as StrengthBlock).sets >= 2));

  const runProfile: CoachProfile = { ...profile, trainingFocus: 'Run', weeklyTrainingTarget: 3 };
  const runPlan = generateDayPlan({ profile: runProfile, history: empty, date: TODAY });
  const shorterRun = shortenPlan(runPlan);
  check('shorten trims run distance by 30 percent', (shorterRun.blocks[0] as { distance: number }).distance, 1.8);

  const hybridPlan = generateDayPlan({ profile, history: { ...empty, workouts: [workout('a', new Date(2026, 9, 12, 18), 'bench-press', 'Chest', 185, [5, 5, 5, 5, 5, 5], 'Bench Press'), workout('b', new Date(2026, 9, 13, 18), 'barbell-back-squat', 'Quads', 225, [5, 5, 5, 5, 5, 5], 'Back Squat')] }, date: TODAY });
  check('hybrid plan to shorten', hybridPlan.kind, 'hybrid');
  const shorterHybrid = shortenPlan(hybridPlan);
  check('shorten swaps a one-round benchmark for the shorter circuit', (shorterHybrid.blocks[0] as { sessionType: string; rounds: number }).sessionType, 'Custom Hybrid');
}
