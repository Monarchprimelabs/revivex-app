import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** A persisted array of records keyed by id. Loads once, saves on every change. */
export function useStoredCollection<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) setItems(parsed as T[]);
        } catch {
          // Corrupt storage: start empty rather than crash.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(key, JSON.stringify(items)).catch(() => undefined);
  }, [items, loaded, key]);

  const upsert = useCallback((item: T) => {
    setItems((prev) => {
      const index = prev.findIndex((candidate) => candidate.id === item.id);
      if (index === -1) return [item, ...prev];
      const next = prev.slice();
      next[index] = item;
      return next;
    });
  }, []);

  const upsertMany = useCallback((incoming: T[]) => {
    if (incoming.length === 0) return;
    setItems((prev) => {
      const map = new Map(prev.map((candidate) => [candidate.id, candidate] as const));
      for (const item of incoming) map.set(item.id, item);
      return [...map.values()];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((candidate) => candidate.id !== id));
  }, []);

  const removeMany = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const gone = new Set(ids);
    setItems((prev) => prev.filter((candidate) => !gone.has(candidate.id)));
  }, []);

  return { items, loaded, setItems, upsert, upsertMany, remove, removeMany };
}

/** A single persisted value with a fallback. */
export function useStoredValue<T>(key: string, fallback: T): [T, (next: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setValue({ ...fallback, ...(JSON.parse(raw) as object) } as T);
        } catch {
          // keep fallback
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => undefined);
    },
    [key]
  );

  return [value, update, loaded];
}
