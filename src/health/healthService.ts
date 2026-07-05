import { Platform } from 'react-native';
import { appleHealthAdapter } from './appleHealthAdapter';
import { healthConnectAdapter } from './healthConnectAdapter';
import type { HealthAdapter } from './types';

/**
 * Picks the platform health adapter.
 * Returns undefined on platforms with no health store (web, etc.).
 */
export function getHealthAdapter(): HealthAdapter | undefined {
  if (Platform.OS === 'ios') return appleHealthAdapter;
  if (Platform.OS === 'android') return healthConnectAdapter;
  return undefined;
}
