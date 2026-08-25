import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getProState,
  purchasePro,
  restorePro,
  type ProPackage,
  type PurchasesStatus,
} from '../monetization/purchases';

/**
 * ReviveX Pro subscription state (Phase 50 — dark until the RevenueCat
 * key is configured). While status is 'unconfigured' the app renders no
 * monetization UI and nothing is gated.
 */

interface ProContextValue {
  status: PurchasesStatus;
  isPro: boolean;
  packages: ProPackage[];
  refresh: () => Promise<void>;
  purchase: (pkg: ProPackage) => Promise<{ isPro: boolean; cancelled: boolean }>;
  restore: () => Promise<boolean>;
}

const ProContext = createContext<ProContextValue | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PurchasesStatus>('unconfigured');
  const [isPro, setIsPro] = useState(false);
  const [packages, setPackages] = useState<ProPackage[]>([]);

  const refresh = useCallback(async () => {
    const state = await getProState();
    setStatus(state.status);
    setIsPro(state.isPro);
    setPackages(state.packages);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = useCallback(
    async (pkg: ProPackage) => {
      const result = await purchasePro(pkg);
      if (result.isPro) setIsPro(true);
      return result;
    },
    []
  );

  const restore = useCallback(async () => {
    const restored = await restorePro();
    if (restored) setIsPro(true);
    return restored;
  }, []);

  const value = useMemo(
    () => ({ status, isPro, packages, refresh, purchase, restore }),
    [status, isPro, packages, refresh, purchase, restore]
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const context = useContext(ProContext);
  if (!context) throw new Error('usePro must be used within ProProvider');
  return context;
}
