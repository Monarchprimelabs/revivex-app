let counter = 0;

/** Device-unique id with a readable prefix. Stored as client_id when mirrored. */
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}
