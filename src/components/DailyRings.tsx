import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppCard from './AppCard';
import ProgressRing from './ProgressRing';
import { useHealth } from '../context/HealthContext';
import { colors, fontSize, fontWeight, spacing } from '../theme/theme';
import type { HealthDailyActivity } from '../health/types';

const STEP_GOAL = 10_000;
const CALORIE_GOAL = 500;

/**
 * Today's steps + active calories from Apple Health / Health Connect as
 * percentage rings (Phase 38). Renders nothing when health sync isn't
 * connected or no data exists — safe on Expo Go.
 */
export default function DailyRings() {
  const { connected, status, getDailyActivity } = useHealth();
  const [activity, setActivity] = useState<HealthDailyActivity | undefined>();

  useEffect(() => {
    if (!connected || status !== 'available') return;

    let cancelled = false;
    getDailyActivity().then((result) => {
      if (!cancelled) setActivity(result);
    });
    return () => {
      cancelled = true;
    };
  }, [connected, status, getDailyActivity]);

  if (!activity) return null;

  const steps = Math.round(activity.steps ?? 0);
  const calories = Math.round(activity.energyBurnedKcal ?? 0);

  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>Today</Text>
      <View style={styles.ringsRow}>
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={steps / STEP_GOAL}
            size={104}
            strokeWidth={9}
            color={colors.accentTeal}
            value={steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : String(steps)}
            label="steps"
          />
          <Text style={styles.goalText}>
            {Math.min(100, Math.round((steps / STEP_GOAL) * 100))}% of {STEP_GOAL / 1000}k
          </Text>
        </View>
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={calories / CALORIE_GOAL}
            size={104}
            strokeWidth={9}
            color={colors.accentCoral}
            value={String(calories)}
            label="kcal"
          />
          <Text style={styles.goalText}>
            {Math.min(100, Math.round((calories / CALORIE_GOAL) * 100))}% of {CALORIE_GOAL}
          </Text>
        </View>
      </View>
      <Text style={styles.source}>From your health app</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.md,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ringWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  source: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
