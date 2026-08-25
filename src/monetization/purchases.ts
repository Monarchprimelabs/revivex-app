import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * RevenueCat subscription service (Phase 50 — built dark).
 *
 * Same pattern as the health adapters: the native module is loaded lazily
 * inside try/catch so Expo Go never crashes, and the whole feature is
 * config-gated behind `expo.extra.revenueCatAppleKey` in app.json.
 * With no key configured the service reports 'unconfigured' and the app
 * shows no monetization UI at all.
 *
 * IMPORTANT: only the PUBLIC SDK key (appl_...) ever goes in app.json.
 * It is designed to be shipped in the app binary. Secret keys never
 * enter this repo.
 */

export type PurchasesStatus = 'unconfigured' | 'needs-dev-build' | 'ready';

export const PRO_ENTITLEMENT_ID = 'pro';

export interface ProPackage {
  identifier: string;
  /** 'MONTHLY' | 'ANNUAL' | ... from RevenueCat's package types. */
  packageType: string;
  priceString: string;
  /** The raw RevenueCat package, passed back on purchase. */
  raw: unknown;
}

export interface ProState {
  status: PurchasesStatus;
  isPro: boolean;
  packages: ProPackage[];
}

function configuredKey(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const key = typeof extra.revenueCatAppleKey === 'string' ? extra.revenueCatAppleKey.trim() : '';
  return key;
}

let purchasesModule: typeof import('react-native-purchases').default | null | undefined;
let configured = false;

function loadPurchases(): typeof import('react-native-purchases').default | null {
  if (purchasesModule !== undefined) return purchasesModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-purchases');
    purchasesModule = (mod.default ??
      mod ??
      null) as typeof import('react-native-purchases').default | null;
  } catch {
    // Expo Go / web: native module unavailable.
    purchasesModule = null;
  }
  return purchasesModule;
}

/** Configure once. Safe to call repeatedly. */
function ensureConfigured(): PurchasesStatus {
  const key = configuredKey();
  if (!key || Platform.OS === 'web') return key ? 'needs-dev-build' : 'unconfigured';

  const Purchases = loadPurchases();
  if (!Purchases) return 'needs-dev-build';

  if (!configured) {
    try {
      Purchases.configure({ apiKey: key });
      configured = true;
    } catch {
      return 'needs-dev-build';
    }
  }
  return 'ready';
}

/** Current entitlement + offering snapshot. Never throws. */
export async function getProState(): Promise<ProState> {
  const status = ensureConfigured();
  if (status !== 'ready') return { status, isPro: false, packages: [] };

  const Purchases = loadPurchases()!;
  let isPro = false;
  let packages: ProPackage[] = [];

  try {
    const info = await Purchases.getCustomerInfo();
    isPro = Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
  } catch {
    // Offline or first launch — treat as free, retry next refresh.
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (current) {
      packages = current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        packageType: String(pkg.packageType),
        priceString: pkg.product.priceString,
        raw: pkg,
      }));
    }
  } catch {
    // Products not approved yet or network issue — paywall shows fallback copy.
  }

  return { status, isPro, packages };
}

/** Purchase one of the packages returned by getProState. */
export async function purchasePro(pkg: ProPackage): Promise<{ isPro: boolean; cancelled: boolean }> {
  const status = ensureConfigured();
  if (status !== 'ready') return { isPro: false, cancelled: false };

  const Purchases = loadPurchases()!;
  try {
    const result = await Purchases.purchasePackage(pkg.raw as never);
    return {
      isPro: Boolean(result.customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]),
      cancelled: false,
    };
  } catch (error) {
    const cancelled = Boolean((error as { userCancelled?: boolean })?.userCancelled);
    return { isPro: false, cancelled };
  }
}

/** Restore purchases (required by App Store review). */
export async function restorePro(): Promise<boolean> {
  const status = ensureConfigured();
  if (status !== 'ready') return false;

  const Purchases = loadPurchases()!;
  try {
    const info = await Purchases.restorePurchases();
    return Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}
