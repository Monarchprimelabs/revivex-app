import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useRuns } from '../../src/context/RunContext';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';
import { formatDistance, formatPace, formatRunDuration } from '../../src/utils/runStats';
import type { Run } from '../../src/types';

export default function RunHistoryScreen() {
  const { runs, runsLoaded } = useRuns();

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Run History</Text>
          <Text style={styles.subtitle}>All manually logged runs.</Text>
        </View>
      </View>

      <PrimaryButton
        label="Log Run"
        variant="tech"
        onPress={() => router.push('/run/log')}
        style={{ marginTop: spacing.lg }}
      />

      {!runsLoaded ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>Loading runs...</Text>
        </AppCard>
      ) : runs.length === 0 ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>
            Log your first run to start tracking mileage, pace, and endurance.
          </Text>
          <PrimaryButton
            label="Log Run"
            variant="primary"
            onPress={() => router.push('/run/log')}
            style={{ marginTop: spacing.md }}
          />
        </AppCard>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          {runs.map((run) => (
            <RunHistoryCard key={run.id} run={run} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function RunHistoryCard({ run }: { run: Run }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/run/[id]', params: { id: run.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{run.title}</Text>
            <Text style={styles.itemSub}>
              {run.runType} • {formatRelativeDate(run.date)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.metricRow}>
          <Metric label="Distance" value={formatDistance(run.distance, run.distanceUnit)} />
          <Metric label="Time" value={formatRunDuration(run.durationSeconds)} />
          <Metric
            label="Pace"
            value={`${formatPace(
              run.distanceUnit === 'mi' ? run.paceSecondsPerMile : run.paceSecondsPerKm
            )}/${run.distanceUnit}`}
          />
        </View>
      </AppCard>
    </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  itemSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
