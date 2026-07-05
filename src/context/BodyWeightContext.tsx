import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PreferredWeightUnit } from '../types';

/**
 * BodyWeightContext
 * Local/private body weight log. New storage key added in Phase 27:
 * `revivex.bodyWeight.v1` — preserve like the other keys.
 */

const STORAGE_KEY = 'revivex.bodyWeight.v1';

export interface BodyWeightEntry {
  id: string;
  date: string; // ISO
  weight: number;
  unit: PreferredWeightUnit;
  createdAt: string;
}

interface BodyWeightContextValue {
  entries: BodyWeightEntry[]; // newest first
  entriesLoaded: boolean;
  addEntry: (weight: number, unit: PreferredWeightUnit, dateIso?: string) => BodyWeightEntry;
  deleteEntry: (entryId: string) => void;
}

const BodyWeightContext = createContext<BodyWeightContextValue | undefined>(undefined);

let _idCounter = 0;
function makeId() {
  _idCounter += 1;
  return `bw_${Date.now()}_${_idCounter}`;
}

function sortEntries(entries: BodyWeightEntry[]): BodyWeightEntry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function BodyWeightProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEntries(sortEntries(JSON.parse(raw) as BodyWeightEntry[]));
      } catch (err) {
        console.warn('Failed to load body weight log:', err);
      } finally {
        setEntriesLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!entriesLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)).catch((err) =>
      console.warn('Failed to save body weight log:', err)
    );
  }, [entries, entriesLoaded]);

  const addEntry = useCallback(
    (weight: number, unit: PreferredWeightUnit, dateIso?: string) => {
      const entry: BodyWeightEntry = {
        id: makeId(),
        date: dateIso || new Date().toISOString(),
        weight: Math.max(0, Number.isFinite(weight) ? Math.round(weight * 10) / 10 : 0),
        unit,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => sortEntries([entry, ...prev]));
      return entry;
    },
    []
  );

  const deleteEntry = useCallback((entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }, []);

  const value = useMemo(
    () => ({ entries, entriesLoaded, addEntry, deleteEntry }),
    [entries, entriesLoaded, addEntry, deleteEntry]
  );

  return <BodyWeightContext.Provider value={value}>{children}</BodyWeightContext.Provider>;
}

export function useBodyWeight(): BodyWeightContextValue {
  const ctx = useContext(BodyWeightContext);
  if (!ctx) throw new Error('useBodyWeight must be used inside <BodyWeightProvider>');
  return ctx;
}
