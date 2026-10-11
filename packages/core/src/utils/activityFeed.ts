import type { ActivityFeedItem, HybridSession, Run, Workout } from '../types';
import { formatDuration, formatDurationShort, formatRelativeDate, formatVolume } from './format';
import { formatDistance, formatPace, formatRunDuration } from './runStats';
import { formatSegmentTime } from './hybridStats';

function safeDateValue(iso?: string): number {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
}

function safeNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function workoutSetCount(workout: Workout): number {
  const savedTotal = safeNumber(workout.totalSets);
  if (savedTotal > 0) return savedTotal;
  return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function workoutVolume(workout: Workout): number {
  const savedVolume = safeNumber(workout.totalVolume);
  if (savedVolume > 0) return savedVolume;

  return workout.exercises.reduce(
    (sum, exercise) =>
      sum +
      exercise.sets.reduce((setSum, set) => {
        const weight = Math.max(0, safeNumber(set.weight));
        const reps = Math.max(0, safeNumber(set.reps));
        return setSum + weight * reps;
      }, 0),
    0
  );
}

export function buildWorkoutActivity(workout: Workout): ActivityFeedItem {
  const exerciseCount = workout.exercises.length;
  const setCount = workoutSetCount(workout);
  const volume = workoutVolume(workout);
  const duration = Math.max(0, safeNumber(workout.duration));

  return {
    id: `workout-${workout.id}`,
    sourceId: workout.id,
    type: 'workout',
    title: workout.title?.trim() || 'Strength Workout',
    date: workout.date,
    dateLabel: formatRelativeDate(workout.date),
    subtitle: `${exerciseCount} exercises • ${setCount} sets • ${formatVolume(volume)} volume`,
    stats: [
      { label: 'Exercises', value: String(exerciseCount) },
      { label: 'Sets', value: String(setCount) },
      { label: 'Volume', value: formatVolume(volume) },
      { label: 'Duration', value: formatDurationShort(duration) },
    ],
    chipLabel: 'Strength',
    route: { pathname: '/workout/[id]', params: { id: workout.id } },
    timestamp: safeDateValue(workout.date) || safeDateValue(workout.startedAt),
  };
}

export function buildRunActivity(run: Run): ActivityFeedItem {
  const pace =
    run.distanceUnit === 'mi' ? run.paceSecondsPerMile : run.paceSecondsPerKm;
  const paceLabel = `${formatPace(pace)}/${run.distanceUnit}`;

  return {
    id: `run-${run.id}`,
    sourceId: run.id,
    type: 'run',
    title: run.title?.trim() || `${run.runType} Run`,
    date: run.date,
    dateLabel: formatRelativeDate(run.date),
    subtitle: `${formatDistance(run.distance, run.distanceUnit)} • ${formatRunDuration(
      run.durationSeconds
    )} • ${paceLabel}`,
    stats: [
      { label: 'Distance', value: formatDistance(run.distance, run.distanceUnit) },
      { label: 'Duration', value: formatRunDuration(run.durationSeconds) },
      { label: 'Pace', value: paceLabel },
      { label: 'Type', value: run.runType },
    ],
    chipLabel: run.runType,
    route: { pathname: '/run/[id]', params: { id: run.id } },
    createdAt: run.createdAt,
    timestamp: safeDateValue(run.date) || safeDateValue(run.createdAt),
  };
}

export function buildHybridActivity(session: HybridSession): ActivityFeedItem {
  const completedSegments = session.segments.filter(
    (segment) => safeNumber(segment.durationSeconds) > 0
  ).length;
  const totalSegments = session.segments.length;

  return {
    id: `hybrid-${session.id}`,
    sourceId: session.id,
    type: 'hybrid',
    title: session.title?.trim() || session.sessionType,
    date: session.date,
    dateLabel: formatRelativeDate(session.date),
    subtitle: `${completedSegments}/${totalSegments} segments • ${formatSegmentTime(
      session.totalDurationSeconds
    )}`,
    stats: [
      { label: 'Total Time', value: formatSegmentTime(session.totalDurationSeconds) },
      { label: 'Segments', value: `${completedSegments}/${totalSegments}` },
      { label: 'Type', value: session.sessionType },
      { label: 'Avg Segment', value: formatAverageSegmentTime(session) },
    ],
    chipLabel: session.sessionType,
    route: { pathname: '/hybrid/[id]', params: { id: session.id } },
    createdAt: session.createdAt,
    timestamp: safeDateValue(session.date) || safeDateValue(session.createdAt),
  };
}

function formatAverageSegmentTime(session: HybridSession): string {
  const timedSegments = session.segments.filter((segment) => safeNumber(segment.durationSeconds) > 0);
  if (timedSegments.length === 0) return formatDuration(0);

  const total = timedSegments.reduce(
    (sum, segment) => sum + Math.max(0, safeNumber(segment.durationSeconds)),
    0
  );

  return formatDuration(total / timedSegments.length);
}

export function buildActivityFeed(
  workouts: Workout[],
  runs: Run[],
  hybridSessions: HybridSession[]
): ActivityFeedItem[] {
  return [
    ...workouts.map(buildWorkoutActivity),
    ...runs.map(buildRunActivity),
    ...hybridSessions.map(buildHybridActivity),
  ]
    .filter((item) => item.sourceId && Number.isFinite(item.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getRecentActivity(
  workouts: Workout[],
  runs: Run[],
  hybridSessions: HybridSession[],
  limit = 4
): ActivityFeedItem[] {
  return buildActivityFeed(workouts, runs, hybridSessions).slice(0, limit);
}

export function buildShareText(item: ActivityFeedItem, displayName?: string): string {
  const owner = displayName?.trim() ? `${displayName.trim()} just logged` : 'Just logged';
  const activityLabel =
    item.type === 'workout'
      ? 'a strength workout'
      : item.type === 'run'
      ? 'a run'
      : 'a hybrid session';

  return `${owner} ${activityLabel} in ReviveX: ${item.title} — ${item.subtitle}. Lift. Run. Revive.`;
}
