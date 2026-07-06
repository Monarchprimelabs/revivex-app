import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import type { GpsFix } from '../utils/gpsTracking';

/**
 * Background GPS pipeline (Phase 31).
 * Works only in a development/production build — Expo Go can't grant
 * "Always" location, so startBackgroundTracking() resolves false there
 * and the tracker stays in foreground mode.
 */

export const BACKGROUND_LOCATION_TASK = 'revivex-background-location';

// Module-level buffer: the background task pushes fixes, the tracking
// screen drains them on an interval.
const fixBuffer: GpsFix[] = [];

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  for (const location of locations) {
    fixBuffer.push({
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      t: location.timestamp,
      accuracy: location.coords.accuracy ?? undefined,
    });
  }
});

export function drainBackgroundFixes(): GpsFix[] {
  return fixBuffer.splice(0, fixBuffer.length);
}

/** Try to start background updates. Resolves false when unavailable. */
export async function startBackgroundTracking(): Promise<boolean> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') return false;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 3,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      foregroundService: {
        notificationTitle: 'ReviveX GPS Run',
        notificationBody: 'Tracking your run — distance, pace, and splits.',
        notificationColor: '#00B4B3',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch {
    // Nothing to stop.
  }
  fixBuffer.length = 0;
}
