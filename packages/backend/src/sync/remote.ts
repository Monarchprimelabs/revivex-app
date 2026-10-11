import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnySyncRow, SyncTable } from '../rows';

/** The few remote operations the sync engine needs. */
export interface RemoteStore {
  /** Inserts or replaces by (user_id, client_id). Resolves with the server timestamp. */
  upsert(table: SyncTable, row: AnySyncRow): Promise<{ updated_at: string }>;
  remove(table: SyncTable, userId: string, clientId: string): Promise<void>;
  /** Rows changed after `since` (exclusive), oldest first. */
  listSince(table: SyncTable, userId: string, since: string | undefined, limit?: number): Promise<AnySyncRow[]>;
}

const CONFLICT_TARGET = 'user_id,client_id';

export class SupabaseRemoteStore implements RemoteStore {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(table: SyncTable, row: AnySyncRow): Promise<{ updated_at: string }> {
    const { data, error } = await this.client
      .from(table)
      .upsert(row, { onConflict: CONFLICT_TARGET })
      .select('updated_at')
      .single();
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    return { updated_at: String((data as { updated_at: string }).updated_at) };
  }

  async remove(table: SyncTable, userId: string, clientId: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq('user_id', userId).eq('client_id', clientId);
    if (error) throw new Error(`${table} delete failed: ${error.message}`);
  }

  async listSince(table: SyncTable, userId: string, since: string | undefined, limit = 500): Promise<AnySyncRow[]> {
    let query = this.client.from(table).select('*').eq('user_id', userId).order('updated_at', { ascending: true }).limit(limit);
    if (since) query = query.gt('updated_at', since);
    const { data, error } = await query;
    if (error) throw new Error(`${table} list failed: ${error.message}`);
    return (data ?? []) as AnySyncRow[];
  }
}

/** In-memory remote used by unit tests and the end-to-end fake backend. */
export class InMemoryRemoteStore implements RemoteStore {
  private readonly rows = new Map<string, AnySyncRow>();
  private tick = 0;
  public failNext: Error | null = null;

  constructor(private readonly now: () => Date = () => new Date()) {}

  private key(table: SyncTable, userId: string, clientId: string): string {
    return `${table}|${userId}|${clientId}`;
  }

  private stamp(): string {
    this.tick += 1;
    const base = this.now().getTime() + this.tick;
    return new Date(base).toISOString();
  }

  private maybeFail(): void {
    if (this.failNext) {
      const error = this.failNext;
      this.failNext = null;
      throw error;
    }
  }

  async upsert(table: SyncTable, row: AnySyncRow): Promise<{ updated_at: string }> {
    this.maybeFail();
    const key = this.key(table, row.user_id, row.client_id);
    const existing = this.rows.get(key);
    const updated_at = this.stamp();
    this.rows.set(key, {
      ...row,
      id: existing?.id ?? `srv_${this.rows.size + 1}`,
      created_at: existing?.created_at ?? updated_at,
      updated_at,
    });
    return { updated_at };
  }

  async remove(table: SyncTable, userId: string, clientId: string): Promise<void> {
    this.maybeFail();
    this.rows.delete(this.key(table, userId, clientId));
  }

  async listSince(table: SyncTable, userId: string, since: string | undefined, limit = 500): Promise<AnySyncRow[]> {
    this.maybeFail();
    return [...this.rows.entries()]
      .filter(([key, row]) => row.user_id === userId && key.startsWith(`${table}|`))
      .map(([, row]) => row)
      .filter((row) => !since || String(row.updated_at) > since)
      .sort((a, b) => String(a.updated_at).localeCompare(String(b.updated_at)))
      .slice(0, limit);
  }

  /** Test helper: write a row as if another device had synced it. */
  seed(table: SyncTable, row: AnySyncRow, updatedAt?: string): AnySyncRow {
    const updated_at = updatedAt ?? this.stamp();
    const stored = { ...row, id: `srv_${this.rows.size + 1}`, created_at: updated_at, updated_at };
    this.rows.set(this.key(table, row.user_id, row.client_id), stored);
    return stored;
  }

  get(table: SyncTable, userId: string, clientId: string): AnySyncRow | undefined {
    return this.rows.get(this.key(table, userId, clientId));
  }

  count(): number {
    return this.rows.size;
  }
}
