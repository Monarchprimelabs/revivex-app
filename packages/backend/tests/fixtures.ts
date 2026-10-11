import type { HybridSession, Routine, Run, Workout } from '@revivex/core';

export function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'wk_1',
    title: 'Push Day',
    date: '2026-10-10T17:00:00.000Z',
    startedAt: '2026-10-10T17:00:00.000Z',
    duration: 3600,
    exercises: [
      {
        id: 'we_1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { id: 'set_1', setNumber: 1, weight: 185, reps: 8, completed: true },
          { id: 'set_2', setNumber: 2, weight: 185, reps: 8, completed: true },
        ],
        restSeconds: 120,
      },
    ],
    notes: 'felt strong',
    totalSets: 2,
    totalVolume: 2960,
    ...overrides,
  };
}

export function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run_1',
    title: 'Easy 5K',
    date: '2026-10-09T12:00:00.000Z',
    distance: 3.1,
    distanceUnit: 'mi',
    durationSeconds: 1680,
    paceSecondsPerMile: 542,
    runType: 'Easy Run',
    source: 'manual',
    createdAt: '2026-10-09T12:30:00.000Z',
    ...overrides,
  };
}

export function makeHybrid(overrides: Partial<HybridSession> = {}): HybridSession {
  return {
    id: 'hy_1',
    title: 'Hybrid Benchmark',
    date: '2026-10-08T12:00:00.000Z',
    sessionType: 'Hybrid Benchmark',
    totalDurationSeconds: 2400,
    segments: [
      { id: 'seg_1', order: 1, name: 'Run', segmentType: 'run', distance: 1, distanceUnit: 'km', durationSeconds: 300 },
      { id: 'seg_2', order: 2, name: 'Wall Balls', segmentType: 'station', durationSeconds: 240 },
    ],
    createdAt: '2026-10-08T12:45:00.000Z',
    ...overrides,
  };
}

export function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: 'rt_1',
    name: 'Upper A',
    goal: 'Strength',
    exercises: [
      { id: 'rtex_1', exerciseId: 'bench-press', exerciseName: 'Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 5, restSeconds: 150 },
    ],
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}
