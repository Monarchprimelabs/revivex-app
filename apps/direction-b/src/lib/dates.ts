/** Parses a YYYY-MM-DD key as local noon so the calendar day never shifts with time zones. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function formatDateKey(key: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' }): string {
  try {
    return parseDateKey(key).toLocaleDateString(undefined, options);
  } catch {
    return key;
  }
}

export function formatToday(date = new Date()): string {
  try {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return date.toDateString();
  }
}
