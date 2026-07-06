import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { useHealth } from '../context/HealthContext';
import { colors, fontSize, fontWeight, spacing } from '../theme/theme';
import type { HealthSessionMetrics } from '../health/types';

/**
 * Shows watch-recorded heart rate and active energy for a session's time
 * window. Renders nothing when health sync isn't connected or no data was
 * recorded, so it is safe on every detail screen (including Expo Go).
 */
export default function HealthMetricsCard({
  dateIso,
  durationSeconds,
}: {
  dateIso: string;
  durationSeconds: number;
}) {
  const { connected, status, providerName, getSessionMetrics } = useHealth();
  const [metrics, setMetrics] = useState<HealthSessionMetrics | undefined>();

  useEffect(() => {
    if (!connected || status !== 'available') return;

    let cancelled = false;
    getSessionMetrics(dateIso, durationSeconds).then((result) => {
      if (!cancelled) setMetrics(result);
    });
    return () => {
      cancelled = true;
    };
  }, [connected, status, dateIso, durationSeconds, getSessionMetrics]);

  if (!metrics) return null;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="heart" size={16} color={colors.danger} />
        <Text style={styles.headerText}>From {providerName}</Text>
      </View>
      <View style={styles.metricRow}>
        <Metric
          label="Avg HR"
          value={metrics.avgHeartRateBpm ? `${Math.round(metrics.avgHeartRateBpm)} bpm` : '—'}
        />
        <Metric
          label="Max HR"
          value={metrics.maxHeartRateBpm ? `${Math.round(metrics.maxHeartRateBpm)} bpm` : '—'}
        />
        <Metric
          label="Energy"
          value={
            metrics.energyBurnedKcal ? `${Math.round(metrics.energyBurnedKcal)} kcal` : '—'
          }
        />
      </View>
    </AppCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  headerText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricRow: {
    flexDirection: 'row',
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
