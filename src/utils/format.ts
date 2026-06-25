/**
 * Small formatting helpers used across workout screens.
 */

function safeDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "1:23:45" or "12:34" depending on length. */
export function formatDuration(totalSeconds: number): string {
  const value = Number(totalSeconds);
  const s = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** "48 min" or "1 hr 12 min" for compact dashboard copy. */
export function formatDurationShort(totalSeconds: number): string {
  const value = Number(totalSeconds);
  const s = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  }

  return `${minutes} min`;
}

/** "Today", "Yesterday", or "Jun 20, 2026". */
export function formatRelativeDate(iso: string): string {
  const d = safeDate(iso);
  if (!d) return 'Unknown date';

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';

  return formatCalendarDate(iso);
}

/** "Jun 20, 2026" for detail rows and permanent records. */
export function formatCalendarDate(iso: string): string {
  const d = safeDate(iso);
  if (!d) return 'Unknown date';

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Friday, Jun 20, 2026" for detail screens when full context helps. */
export function formatFullDate(iso: string): string {
  const d = safeDate(iso);
  if (!d) return 'Unknown date';

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "12,345 kg" — compact, locale-aware. */
export function formatVolume(kg: number): string {
  const value = Number(kg);
  if (!Number.isFinite(value) || value <= 0) return '0 kg';
  return `${Math.round(value).toLocaleString()} kg`;
}
