import type { AnySyncRow, SyncTable } from '../rows';
import { fingerprint } from './fingerprint';
import type { RemoteStore } from './remote';
import {
  findEntry,
  markDeleted,
  markFailed,
  markPulled,
  markSynced,
  trackedItem,
  type SyncState,
} from './state';

export interface FlushDeps {
  remote: RemoteStore;
  userId: string;
  /** Returns the current local item for an outbox entry, or undefined if it no longer exists. */
  getLocal: (table: SyncTable, clientId: string) => unknown;
  toRow: (table: SyncTable, userId: string, item: unknown) => AnySyncRow;
  /** Stop after this many entries per flush so the UI never waits on a huge backlog. */
  maxEntries?: number;
}

export interface FlushResult {
  state: SyncState;
  pushed: number;
  deleted: number;
  failed: number;
}

/**
 * Pushes queued changes in order. A failure marks the entry and moves on, so
 * one bad row never blocks the rest. Entries are re-read from local state at
 * push time, so the newest content always wins over a stale queue payload.
 */
export async function flushOutbox(state: SyncState, deps: FlushDeps): Promise<FlushResult> {
  let next = state;
  let pushed = 0;
  let deleted = 0;
  let failed = 0;
  const entries = state.outbox.slice(0, deps.maxEntries ?? 50);
  for (const entry of entries) {
    try {
      if (entry.op === 'delete') {
        await deps.remote.remove(entry.table, deps.userId, entry.clientId);
        next = markDeleted(next, entry.table, entry.clientId);
        deleted += 1;
        continue;
      }
      const item = deps.getLocal(entry.table, entry.clientId);
      if (item === undefined || item === null) {
        // Deleted locally before it was ever pushed.
        next = markDeleted(next, entry.table, entry.clientId);
        continue;
      }
      const row = deps.toRow(entry.table, deps.userId, item);
      const { updated_at } = await deps.remote.upsert(entry.table, row);
      next = markSynced(next, entry.table, entry.clientId, updated_at);
      pushed += 1;
    } catch (error) {
      failed += 1;
      next = markFailed(next, entry.table, entry.clientId, error instanceof Error ? error.message : String(error));
    }
  }
  return { state: next, pushed, deleted, failed };
}

export interface ApplyResult<T> {
  state: SyncState;
  items: T[];
  /** Ids inserted or replaced from the server. */
  applied: string[];
}

/**
 * Merges rows pulled from the server into a local collection.
 *
 * Rules, per row:
 * 1. A version we have already seen is ignored.
 * 2. A locally deleted item (delete still queued) stays deleted.
 * 3. An item we never had is inserted.
 * 4. An unchanged local item is replaced by the newer server version.
 * 5. A changed local item resolves last-write-wins between its own
 *    updatedAt and the server updated_at. The loser is discarded.
 */
export function applyRemoteRows<T extends { id: string; updatedAt?: string }>(
  state: SyncState,
  table: SyncTable,
  rows: AnySyncRow[],
  local: T[],
  fromRow: (row: AnySyncRow) => T
): ApplyResult<T> {
  let next = state;
  const byId = new Map(local.map((item) => [item.id, item] as const));
  const applied: string[] = [];
  let newest = state.lastPulledAt[table];

  for (const row of rows) {
    const clientId = row.client_id;
    const serverUpdatedAt = row.updated_at ? String(row.updated_at) : undefined;
    if (serverUpdatedAt && (!newest || serverUpdatedAt > newest)) newest = serverUpdatedAt;

    const tracked = trackedItem(next, table, clientId);
    if (tracked?.serverUpdatedAt && serverUpdatedAt && serverUpdatedAt <= tracked.serverUpdatedAt) continue;

    const pending = findEntry(next, table, clientId);
    if (pending?.op === 'delete') continue;

    const incoming = fromRow(row);
    const existing = byId.get(clientId);
    if (!existing) {
      byId.set(clientId, incoming);
      next = markPulled(next, table, incoming, serverUpdatedAt);
      applied.push(clientId);
      continue;
    }

    const localChanged = tracked ? tracked.fp !== tracked.syncedFp || fingerprint(existing) !== tracked.syncedFp : true;
    if (!localChanged) {
      byId.set(clientId, incoming);
      next = markPulled(next, table, incoming, serverUpdatedAt);
      applied.push(clientId);
      continue;
    }

    const localTime = existing.updatedAt ?? tracked?.serverUpdatedAt ?? '';
    if (serverUpdatedAt && serverUpdatedAt > localTime) {
      byId.set(clientId, incoming);
      next = markPulled(next, table, incoming, serverUpdatedAt);
      applied.push(clientId);
    } else {
      // Local wins and stays queued; remember the server version so it is not re-applied.
      const current = trackedItem(next, table, clientId);
      next = {
        ...next,
        tracking: {
          ...next.tracking,
          [table]: { ...(next.tracking[table] ?? {}), [clientId]: { fp: current?.fp ?? fingerprint(existing), syncedFp: current?.syncedFp, serverUpdatedAt } },
        },
      };
    }
  }

  if (newest && newest !== state.lastPulledAt[table]) {
    next = { ...next, lastPulledAt: { ...next.lastPulledAt, [table]: newest } };
  }
  return { state: next, items: [...byId.values()], applied };
}

export interface PullDeps<T> {
  remote: RemoteStore;
  userId: string;
  local: T[];
  fromRow: (row: AnySyncRow) => T;
  /** Set to true to ignore lastPulledAt and fetch everything (first sign-in). */
  full?: boolean;
}

export async function pullTable<T extends { id: string; updatedAt?: string }>(
  state: SyncState,
  table: SyncTable,
  deps: PullDeps<T>
): Promise<ApplyResult<T>> {
  const since = deps.full ? undefined : state.lastPulledAt[table];
  const rows = await deps.remote.listSince(table, deps.userId, since);
  return applyRemoteRows(state, table, rows, deps.local, deps.fromRow);
}
