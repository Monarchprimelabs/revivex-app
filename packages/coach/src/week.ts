import type { HybridSession, Run, TrainingFocus, Workout } from '@revivex/core';
import type { CoachHistory, SlotKind } from './types';

/** YYYY-MM-DD in device local time. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday 00:00 local time of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  return start;
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

const TEMPLATES: Record<TrainingFocus, Record<number, SlotKind[]>> = {
  Lift: {
    2: ['upper', 'lower'],
    3: ['push', 'pull', 'legs'],
    4: ['upper', 'lower', 'upper', 'lower'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  },
  Run: {
    2: ['run_easy', 'run_long'],
    3: ['run_easy', 'run_quality', 'run_long'],
    4: ['run_easy', 'run_quality', 'run_easy', 'run_long'],
    5: ['run_easy', 'run_quality', 'run_easy', 'run_easy', 'run_long'],
    6: ['run_easy', 'run_quality', 'run_easy', 'run_quality', 'run_easy', 'run_long'],
  },
  Hybrid: {
    2: ['full', 'hybrid'],
    3: ['full', 'run_easy', 'hybrid'],
    4: ['upper', 'run_easy', 'lower', 'hybrid'],
    5: ['upper', 'run_easy', 'lower', 'run_quality', 'hybrid'],
    6: ['push', 'run_easy', 'pull', 'run_quality', 'legs', 'hybrid'],
  },
  'General Fitness': {
    2: ['full', 'run_easy'],
    3: ['full', 'run_easy', 'full'],
    4: ['upper', 'run_easy', 'lower', 'run_easy'],
    5: ['upper', 'run_easy', 'lower', 'full', 'run_easy'],
    6: ['push', 'run_easy', 'pull', 'run_easy', 'legs', 'hybrid'],
  },
};

export function weekTemplateFor(focus: TrainingFocus, weeklyTarget: number): SlotKind[] {
  const target = Math.min(6, Math.max(2, Math.round(weeklyTarget || 3)));
  return TEMPLATES[focus]?.[target] ?? TEMPLATES['General Fitness'][target];
}

export interface WeekSession {
  date: string;
  kind: 'workout' | 'run' | 'hybrid';
  item: Workout | Run | HybridSession;
}

/** Every logged session from Monday through the end of `date`, oldest first. */
export function sessionsThisWeek(history: CoachHistory, date: Date): WeekSession[] {
  const start = startOfWeek(date).getTime();
  const end = endOfDay(date).getTime();
  const within = (iso: string) => {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) && t >= start && t <= end;
  };
  const sessions: WeekSession[] = [
    ...history.workouts.filter((w) => within(w.date)).map((w) => ({ date: w.date, kind: 'workout' as const, item: w })),
    ...history.runs.filter((r) => within(r.date)).map((r) => ({ date: r.date, kind: 'run' as const, item: r })),
    ...history.hybridSessions.filter((h) => within(h.date)).map((h) => ({ date: h.date, kind: 'hybrid' as const, item: h })),
  ];
  return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const SLOT_TITLES: Record<SlotKind, string> = {
  upper: 'Upper body strength',
  lower: 'Lower body strength',
  push: 'Push day',
  pull: 'Pull day',
  legs: 'Leg day',
  full: 'Full body strength',
  run_easy: 'Easy run',
  run_quality: 'Tempo run',
  run_long: 'Long run',
  hybrid: 'Hybrid conditioning',
};

export function slotKindToPlanKind(slot: SlotKind): 'lift' | 'run' | 'hybrid' {
  if (slot === 'hybrid') return 'hybrid';
  if (slot.startsWith('run_')) return 'run';
  return 'lift';
}
