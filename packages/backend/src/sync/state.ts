import type { KeyValueStorage } from '../client';
import type { SyncTable } from '../rows';
import { fingerprint } from './fingerprint';

export type OutboxOp = 'upsert' | 'delete';

export interface OutboxEntry {
  table: SyncTable;
  clientId: string;
  op: OutboxOp;
  enqueuedAt: string;
  attempts: number;
  lastError?: string;
}

export interface TrackedItem {
  /** Fingerprint of the local item the last time we looked. */
  fp: string;
  /** Fingerprint that was last confirmed written to the server. */
  syncedFp?: string;
  /** Server `updated_at` we have seen for this item. */
  serverUpdatedAt?: string;
}

export type TableTracking = Record<string, TrackedItem>;

export interface SyncState {
  version: 1;
  outbox: OutboxEntry[];
  tracking: Partial<Record<SyncTable, TableTracking>>;
  lastPulledAt: Partial<Record<SyncTable, string>>;
}

export type SyncStatus = 'local' | 'pending' | 'synced' | 'error';

export function emptySyncState(): SyncState {
  return { version: 1, outbox: [], tracking: {}, lastPulledAt: {} };
}

export function findEntry(state: SyncState, table: SyncTable, clientId: string): OutboxEntry | undefined {
  return state.outbox.find((entry) => entry.table === table && entry.clientId === clientId);
}

function withoutEntry(outbox: OutboxEntry[], table: SyncTable, clientId: string): OutboxEntry[] {
  return outbox.filter((entry) => !(entry.table === table && entry.clientId === clientId));
}

export function enqueue(state: SyncState, table: SyncTable, clientId: string, op: OutboxOp, now: string): SyncState {
  const existing = findEntry(state, table, clientId);
  const entry: OutboxEntry = {
    table,
    clientId,
    op,
    enqueuedAt: existing?.enqueuedAt ?? now,
    attempts: 0,
  };
  return { ...state, outbox: [...withoutEntry(state.outbox, table, clientId), entry] };
}

export function dequeue(state: SyncState, table: SyncTable, clientId: string): SyncState {
  return { ...state, outbox: withoutEntry(state.outbox, table, clientId) };
}

function setTracked(state: SyncState, table: SyncTable, clientId: string, tracked: TrackedItem | undefined): SyncState {
  const current = { ...(state.tracking[table] ?? {}) };
  if (tracked) current[clientId] = tracked;
  else delete current[clientId];
  return { ...state, tracking: { ...state.tracking, [table]: current } };
}

export function trackedItem(state: SyncState, table: SyncTable, clientId: string): TrackedItem | undefined {
  return state.tracking[table]?.[clientId];
}

/**
 * Compares a local collection against what we have tracked and queues the
 * differences: new or changed items become upserts, missing items become
 * deletes. Returns the same state object when nothing changed.
 */
export function reconcileCollection(
  state: SyncState,
  table: SyncTable,
  items: ReadonlyArray<{ id: string }>,
  now: string
): SyncState {
  let next = state;
  const seen = new Set<string>();
  for (const item of items) {
    seen.add(item.id);
    const fp = fingerprint(item);
    const tracked = trackedItem(next, table, item.id);
    if (tracked?.fp === fp) continue;
    next = setTracked(next, table, item.id, { ...tracked, fp });
    if (tracked?.syncedFp === fp) {
      // Local content matches what the server already has: nothing to push.
      next = dequeue(next, table, item.id);
      continue;
    }
    next = enqueue(next, table, item.id, 'upsert', now);
  }
  const tracking = next.tracking[table] ?? {};
  for (const clientId of Object.keys(tracking)) {
    if (seen.has(clientId)) continue;
    const tracked = tracking[clientId];
    next = setTracked(next, table, clientId, undefined);
    if (tracked.syncedFp || tracked.serverUpdatedAt) {
      next = enqueue(next, table, clientId, 'delete', now);
    } else {
      next = dequeue(next, table, clientId);
    }
  }
  return next;
}

export function markSynced(state: SyncState, table: SyncTable, clientId: string, serverUpdatedAt: string | undefined): SyncState {
  const tracked = trackedItem(state, table, clientId);
  const next = setTracked(state, table, clientId, {
    fp: tracked?.fp ?? '',
    syncedFp: tracked?.fp ?? '',
    serverUpdatedAt: serverUpdatedAt ?? tracked?.serverUpdatedAt,
  });
  return dequeue(next, table, clientId);
}

export function markDeleted(state: SyncState, table: SyncTable, clientId: string): SyncState {
  return dequeue(setTracked(state, table, clientId, undefined), table, clientId);
}

export function markFailed(state: SyncState, table: SyncTable, clientId: string, error: string): SyncState {
  return {
    ...state,
    outbox: state.outbox.map((entry) =>
      entry.table === table && entry.clientId === clientId
        ? { ...entry, attempts: entry.attempts + 1, lastError: error.slice(0, 300) }
        : entry
    ),
  };
}

/** Records that a remote version of an item is now the local version. */
export function markPulled(state: SyncState, table: SyncTable, item: { id: string }, serverUpdatedAt: string | undefined): SyncState {
  const fp = fingerprint(item);
  const next = setTracked(state, table, item.id, { fp, syncedFp: fp, serverUpdatedAt });
  return dequeue(next, table, item.id);
}

export function statusFor(state: SyncState, table: SyncTable, clientId: string, cloudActive: boolean): SyncStatus {
  if (!cloudActive) return 'local';
  const entry = findEntry(state, table, clientId);
  if (entry) return entry.lastError ? 'error' : 'pending';
  const tracked = trackedItem(state, table, clientId);
  if (tracked?.syncedFp && tracked.syncedFp === tracked.fp) return 'synced';
  return 'local';
}

export function pendingCount(state: SyncState): number {
  return state.outbox.length;
}

export async function loadSyncState(storage: KeyValueStorage, key: string): Promise<SyncState> {
  try {
    const raw = await storage.getItem(key);
    if (!raw) return emptySyncState();
    const parsed = JSON.parse(raw) as Partial<SyncState>;
    if (parsed.version !== 1) return emptySyncState();
    return {
      version: 1,
      outbox: Array.isArray(parsed.outbox) ? parsed.outbox : [],
      tracking: parsed.tracking ?? {},
      lastPulledAt: parsed.lastPulledAt ?? {},
    };
  } catch {
    return emptySyncState();
  }
}

export async function saveSyncState(storage: KeyValueStorage, key: string, state: SyncState): Promise<void> {
  await storage.setItem(key, JSON.stringify(state));
}
