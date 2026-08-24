import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback wrappers (Phase 48 premium feel).
 * Every call is fire-and-forget and safe on platforms without haptics
 * (web, some Android devices) — failures are swallowed.
 */

function safe(run: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  run().catch(() => {});
}

/** Light tick — chip taps, small toggles. */
export function tapLight(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium thunk — completing a set, starting a workout. */
export function tapMedium(): void {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Success notification — finishing a workout/run, rest timer done. */
export function notifySuccess(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Warning notification — destructive confirms, timer about to end. */
export function notifyWarning(): void {
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Celebration pattern — new PR. A quick double-hit reads as "big moment". */
export function celebratePR(): void {
  safe(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });
}
