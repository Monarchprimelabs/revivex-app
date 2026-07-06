import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AppCard from '../../../src/components/AppCard';
import PrimaryButton from '../../../src/components/PrimaryButton';
import SectionHeader from '../../../src/components/SectionHeader';
import { useWorkout } from '../../../src/context/WorkoutContext';
import { useProfile } from '../../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/theme/theme';
import { formatRelativeDate, formatVolume } from '../../../src/utils/format';
import { formatEst1RM, formatPRWeight } from '../../../src/utils/prHistory';
import {
  getExerciseProgress,
  type ExerciseSession,
} from '../../../src/utils/exerciseProgress';

const CHART_SESSION_LIMIT = 12;

type TrendMetric = 'est1RM' | 'volume';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ExerciseProgressScreen() {
  const params = useLocalSearchParams<{ key?: string }>();
  const exerciseKey = firstParam(params.key);
  const { history, historyLoaded } = useWorkout();
  const { profile } = useProfile();
  const weightUnit = profile?.preferredWeightUnit ?? 'lb';
  const [metric, setMetric] = useState<TrendMetric>('est1RM');

  const progress = useMemo(
    () => (exerciseKey ? getExerciseProgress(history, exerciseKey) : undefined),
    [exerciseKey, history]
  );

  // Oldest -> newest for the trend chart.
  const chartSessions = useMemo(() => {
    if (!progress) return [];
    return [...progress.sessions].reverse().slice(-CHART_SESSION_LIMIT);
  }, [progress]);

  if (!historyLoaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar title="Exercise Progress" />
        <View style={styles.missingWrap}>
          <Text style={styles.placeholder}>Loading exercise history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exerciseKey || !progress) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TopBar title="Exercise Progress" />
        <View style={styles.missingWrap}>
          <Ionicons name="barbell-outline" size={32} color={colors.textMuted} />
          <Text style={styles.missingTitle}>No history for this exercise</Text>
          <Text style={styles.emptyText}>
            Log completed weighted sets for this exercise and its trend will show up here.
          </Text>
          <PrimaryButton
            label="Back to Progress"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const maxChartValue = Math.max(
    ...chartSessions.map((session) =>
      metric === 'est1RM' ? session.bestEst1RM : session.sessionVolume
    ),
    1
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <TopBar title={progress.exerciseName} subtitle={progress.muscleGroup} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <SummaryMetric
            label="Best Set"
            value={`${formatPRWeight(progress.bestWeight, weightUnit)}`}
          />
          <SummaryMetric
            label="Est 1RM"
            value={formatEst1RM(progress.bestEst1RM, weightUnit)}
          />
          <SummaryMetric label="Sessions" value={String(progress.totalSessions)} />
        </View>

        <SectionHeader title="Trend" />
        <AppCard>
          <View style={styles.metricToggle}>
            <MetricChip
              label="Est 1RM"
              selected={metric === 'est1RM'}
              onPress={() => setMetric('est1RM')}
            />
            <MetricChip
              label="Session Volume"
              selected={metric === 'volume'}
              onPress={() => setMetric('volume')}
            />
          </View>

          <View style={styles.chartRow}>
            {chartSessions.map((session) => {
              const value = metric === 'est1RM' ? session.bestEst1RM : session.sessionVolume;
              const barHeight = Math.max(6, Math.round((value / maxChartValue) * 92));
              return (
                <View key={session.workoutId} style={styles.chartBarWrap}>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartFill,
                        {
                          height: barHeight,
                          backgroundColor: value > 0 ? colors.accentTeal : colors.border,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>
              {chartSessions[0] ? formatRelativeDate(chartSessions[0].date) : ''}
            </Text>
            <Text style={styles.chartFooterText}>
              last {chartSessions.length} session{chartSessions.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.chartFooterText}>
              {chartSessions[chartSessions.length - 1]
                ? formatRelativeDate(chartSessions[chartSessions.length - 1].date)
                : ''}
            </Text>
          </View>
        </AppCard>

        <SectionHeader title="Session History" />
        <AppCard style={styles.bottomCard}>
          {progress.sessions.map((session, index) => (
            <SessionRow
              key={session.workoutId}
              session={session}
              weightUnit={weightUnit}
              divider={index !== progress.sessions.length - 1}
            />
          ))}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
        <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.topCenter}>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.topBarSub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.topBarBtn} />
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MetricChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.metricChip, selected && styles.metricChipSelected]}
    >
      <Text style={[styles.metricChipText, selected && styles.metricChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SessionRow({
  session,
  weightUnit,
  divider,
}: {
  session: ExerciseSession;
  weightUnit: string;
  divider: boolean;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/workout/[id]', params: { id: session.workoutId } })
      }
      style={[styles.sessionRow, divider && styles.rowDivider]}
    >
      <View style={styles.sessionContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {session.workoutTitle}
        </Text>
        <Text style={styles.rowSub}>
          {formatRelativeDate(session.date)} • {session.completedSets}/{session.totalSets} sets
          • {formatVolume(session.sessionVolume)}
        </Text>
      </View>
      <View style={styles.sessionResult}>
        <Text style={styles.sessionWeight}>
          {session.bestWeight > 0
            ? `${formatPRWeight(session.bestWeight, weightUnit)} x ${session.bestReps}`
            : '—'}
        </Text>
        <Text style={styles.rowSub}>
          {session.bestEst1RM > 0
            ? `est 1RM ${formatEst1RM(session.bestEst1RM, weightUnit)}`
            : 'no weighted sets'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topBarBtn: {
    width: 44,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  topBarSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryMetric: {
    flex: 1,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  metricToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  metricChipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.10)',
  },
  metricChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  metricChipTextSelected: {
    color: colors.accentTeal,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
  },
  chartTrack: {
    height: 96,
    width: 12,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  chartFill: {
    width: 12,
    borderRadius: radius.pill,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  chartFooterText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  sessionContent: {
    flex: 1,
  },
  sessionResult: {
    alignItems: 'flex-end',
  },
  sessionWeight: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  bottomCard: {
    marginBottom: spacing.lg,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
