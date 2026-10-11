import type { PreferredDistanceUnit, Run } from '@revivex/core';
import type { CoachProfile, ReadinessAssessment, RunBlock, SlotKind } from './types';
import { startOfWeek } from './week';

const MILES_PER_KM = 0.621371;

function distanceIn(run: Run, unit: PreferredDistanceUnit): number {
  if (run.distanceUnit === unit) return run.distance;
  return unit === 'mi' ? run.distance * MILES_PER_KM : run.distance / MILES_PER_KM;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Distance run between the previous Monday and the one before it, in `unit`. */
export function lastWeekVolume(runs: Run[], now: Date, unit: PreferredDistanceUnit): number {
  const thisMonday = startOfWeek(now).getTime();
  const lastMonday = thisMonday - 7 * 86400000;
  return runs
    .filter((run) => {
      const t = new Date(run.date).getTime();
      return t >= lastMonday && t < thisMonday;
    })
    .reduce((sum, run) => sum + distanceIn(run, unit), 0);
}

export function thisWeekVolume(runs: Run[], now: Date, unit: PreferredDistanceUnit): number {
  const thisMonday = startOfWeek(now).getTime();
  return runs
    .filter((run) => {
      const t = new Date(run.date).getTime();
      return t >= thisMonday && t <= now.getTime();
    })
    .reduce((sum, run) => sum + distanceIn(run, unit), 0);
}

/** Average pace in seconds per `unit` over the most recent runs with a pace. */
export function recentAveragePace(runs: Run[], unit: PreferredDistanceUnit, count = 4): number | undefined {
  const recent = [...runs]
    .filter((run) => run.distance > 0 && run.durationSeconds > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
  if (recent.length === 0) return undefined;
  const totalDistance = recent.reduce((sum, run) => sum + distanceIn(run, unit), 0);
  const totalSeconds = recent.reduce((sum, run) => sum + run.durationSeconds, 0);
  return totalDistance > 0 ? Math.round(totalSeconds / totalDistance) : undefined;
}

export function longestRecentRun(runs: Run[], now: Date, unit: PreferredDistanceUnit, days = 28): number {
  const since = now.getTime() - days * 86400000;
  return runs
    .filter((run) => new Date(run.date).getTime() >= since)
    .reduce((max, run) => Math.max(max, distanceIn(run, unit)), 0);
}

function defaults(profile: CoachProfile): number {
  const miles = profile.experienceLevel === 'Beginner' ? 1.5 : profile.experienceLevel === 'Intermediate' ? 2.5 : 3.5;
  return profile.preferredDistanceUnit === 'mi' ? miles : round1(miles / MILES_PER_KM);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function buildRunBlock(slot: SlotKind, profile: CoachProfile, runs: Run[], readiness: ReadinessAssessment | undefined, now: Date): { block: RunBlock; notes: string[] } {
  const unit = profile.preferredDistanceUnit;
  const factor = unit === 'mi' ? 1 : 1 / MILES_PER_KM; // bounds expressed in miles, converted to the unit
  const volume = Math.max(lastWeekVolume(runs, now, unit), thisWeekVolume(runs, now, unit));
  const avgPace = recentAveragePace(runs, unit);
  const notes: string[] = [];
  const easyPace = avgPace ? avgPace + Math.round((unit === 'mi' ? 60 : 37)) : undefined;
  const tempoPace = avgPace ? Math.max(60, avgPace - Math.round(unit === 'mi' ? 30 : 19)) : undefined;

  let runType: RunBlock['runType'] = 'Easy Run';
  let distance: number;
  let pace = easyPace;
  let note: string;

  const effectiveSlot: SlotKind = readiness?.band === 'moderate' && slot !== 'run_easy' ? 'run_easy' : slot;
  if (effectiveSlot !== slot) notes.push('Readiness is moderate, so the quality session becomes an easy run.');

  if (volume <= 0) {
    distance = defaults(profile);
    note = 'No recent runs on record, so this starts conservatively. Keep it conversational.';
    if (effectiveSlot === 'run_long') distance = round1(distance * 1.4);
  } else if (effectiveSlot === 'run_quality') {
    runType = 'Tempo';
    distance = round1(clamp(0.2 * volume, 2 * factor, 5 * factor));
    pace = tempoPace;
    note = 'Warm up easy for the first part, hold a comfortably hard tempo in the middle, cool down easy.';
  } else if (effectiveSlot === 'run_long') {
    runType = 'Long Run';
    const longest = longestRecentRun(runs, now, unit);
    distance = round1(clamp(Math.max(0.3 * volume * 1.1, longest * 1.05), 3 * factor, 13 * factor));
    note = 'Long and steady. The goal is time on feet, not pace.';
  } else {
    distance = round1(clamp(0.25 * volume, 2 * factor, 6 * factor));
    note = 'Easy effort. You should be able to speak in full sentences.';
  }

  if (readiness?.band === 'moderate') {
    distance = round1(distance * 0.7);
    notes.push('Distance is trimmed 30% for readiness.');
  }

  if (volume > 0) notes.push(`Weekly volume on record is ${round1(volume)} ${unit}, which sets today's distance.`);

  return {
    block: { type: 'run', runType, distance: Math.max(round1(distance), 0.5), distanceUnit: unit, targetPaceSeconds: pace, note },
    notes,
  };
}

export function estimateRunMinutes(block: RunBlock): number {
  const paceSeconds = block.targetPaceSeconds ?? (block.distanceUnit === 'mi' ? 600 : 373);
  return Math.round((block.distance * paceSeconds) / 60);
}

export function formatPaceSeconds(paceSeconds: number | undefined, unit: PreferredDistanceUnit): string {
  if (!paceSeconds) return 'easy';
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} /${unit}`;
}
