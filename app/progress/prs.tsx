import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';
import {
  formatEst1RM,
  formatPRWeight,
  getPRHistory,
  type ExercisePRSummary,
  type PREvent,
} from '../../src/utils/prHistory';

const RECENT_PR_LIMIT = 8;

export default function PRHistoryScreen() {
  const { history, historyLoaded } = useWorkout();
  const { profile } = useProfile();
  const weightUnit = profile?.preferredWeightUnit ?? 'lb';

  const { summaries, events } = useMemo(() => getPRHistory(history), [history]);
  const recentEvents = events.slice(0, RECENT_PR_LIMIT);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>PR History</Text>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {!historyLoaded ? (
          <AppCard>
            <Text style={styles.placeholder}>Loading PR history...</Text>
          </AppCard>
        ) : summaries.length === 0 ? (
          <AppCard elevated tint="strength" style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="trophy-outline" size={28} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No PRs yet</Text>
            <Text style={styles.emptySub}>
              Complete weighted sets in your workouts and ReviveX will track your best
              lifts and estimated one-rep maxes here.
            </Text>
            <PrimaryButton
              label="Start Workout"
              variant="primary"
              onPress={() => router.push('/workout/active')}
              style={styles.emptyButton}
            />
          </AppCard>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <SummaryMetric label="Exercises" value={String(summaries.length)} />
              <SummaryMetric label="Total PRs" value={String(events.length)} />
              <SummaryMetric
                label="Last PR"
                value={events[0] ? formatRelativeDate(events[0].date) : '—'}
              />
            </View>

            <SectionHeader title="Recent PRs" />
            <AppCard>
              {recentEvents.map((event, index) => (
                <PREventRow
                  key={`${event.workoutId}-${event.exerciseId}-${event.kind}-${index}`}
                  event={event}
                  weightUnit={weightUnit}
                  divider={index !== recentEvents.length - 1}
                />
              ))}
            </AppCard>

            <SectionHeader title="All-Time Bests" />
            <AppCard style={styles.bottomCard}>
              {summaries.map((summary, index) => (
                <ExerciseBestRow
                  key={`${summary.exerciseId}-${summary.exerciseName}`}
                  summary={summary}
                  weightUnit={weightUnit}
                  divider={index !== summaries.length - 1}
                />
              ))}
            </AppCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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

function PREventRow({
  event,
  weightUnit,
  divider,
}: {
  event: PREvent;
  weightUnit: string;
  divider: boolean;
}) {
  const isFirstRecord = event.previousWeight === undefined;
  const kindLabel = isFirstRecord
    ? 'First logged'
    : event.kind === 'weight'
      ? 'New top weight'
      : 'New est 1RM';

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/workout/[id]', params: { id: event.workoutId } })
      }
      style={[styles.eventRow, divider && styles.rowDivider]}
    >
      <View style={styles.eventBadge}>
        <Ionicons
          name={isFirstRecord ? 'flag-outline' : 'trophy'}
          size={16}
          color={colors.gold}
        />
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.rowTitle}>{event.exerciseName}</Text>
        <Text style={styles.rowSub}>
          {kindLabel} • {formatRelativeDate(event.date)}
        </Text>
      </View>
      <View style={styles.eventResult}>
        <Text style={styles.eventWeight}>
          {formatPRWeight(event.weight, weightUnit)} x {event.reps}
        </Text>
        <Text style={styles.rowSub}>est 1RM {formatEst1RM(event.est1RM, weightUnit)}</Text>
      </View>
    </Pressable>
  );
}

function ExerciseBestRow({
  summary,
  weightUnit,
  divider,
}: {
  summary: ExercisePRSummary;
  weightUnit: string;
  divider: boolean;
}) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/workout/[id]',
          params: { id: summary.bestWeight.workoutId },
        })
      }
      style={[styles.bestRow, divider && styles.rowDivider]}
    >
      <View style={styles.bestContent}>
        <Text style={styles.rowTitle}>{summary.exerciseName}</Text>
        <Text style={styles.rowSub}>
          {summary.muscleGroup} • {summary.prCount} PR{summary.prCount === 1 ? '' : 's'} •{' '}
          {formatRelativeDate(summary.lastPRDate)}
        </Text>
      </View>
      <View style={styles.bestResult}>
        <Text style={styles.bestWeight}>
          {formatPRWeight(summary.bestWeight.weight, weightUnit)} x{' '}
          {summary.bestWeight.reps}
        </Text>
        <Text style={styles.rowSub}>
          est 1RM {formatEst1RM(summary.bestEst1RM.est1RM, weightUnit)}
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
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
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
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  eventBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  eventContent: {
    flex: 1,
  },
  eventResult: {
    alignItems: 'flex-end',
  },
  eventWeight: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  bestContent: {
    flex: 1,
  },
  bestResult: {
    alignItems: 'flex-end',
  },
  bestWeight: {
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
  emptyCard: {
    alignItems: 'center',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: colors.gold,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});
