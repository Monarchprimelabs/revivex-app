import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import StatCard from '../../src/components/StatCard';
import SectionHeader from '../../src/components/SectionHeader';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useRuns } from '../../src/context/RunContext';
import { useHybridSessions } from '../../src/context/HybridContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import { formatRelativeDate, formatVolume } from '../../src/utils/format';
import {
  getAverageWorkoutVolume,
  getBestVolumeWorkout,
  getCurrentTrainingStreak,
  getMostFrequentExercise,
  getMostTrainedMuscleGroup,
  getMuscleGroupStats,
  getTopExercisePRs,
  getTotalSets,
  getTotalVolume,
  getTotalWorkouts,
  getWeeklyActivity,
  getWorkoutsThisWeek,
  type MuscleGroupStat,
} from '../../src/utils/progress';
import type { ExercisePR } from '../../src/utils/progress';
import {
  calculateRunStats,
  formatDistance,
  formatPace,
} from '../../src/utils/runStats';
import {
  formatSegmentTime,
  getHybridSessionStats,
} from '../../src/utils/hybridStats';

/**
 * Progress screen
 * Phase 5 dashboard built from saved strength workout history.
 */
export default function ProgressScreen() {
  const { history, historyLoaded } = useWorkout();
  const { runs, runsLoaded } = useRuns();
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();

  const analytics = useMemo(() => {
    const totalWorkouts = getTotalWorkouts(history);
    const totalVolume = getTotalVolume(history);
    const totalSets = getTotalSets(history);
    const muscleGroupStats = getMuscleGroupStats(history);
    const runStats = calculateRunStats(runs);
    const hybridStats = getHybridSessionStats(hybridSessions);

    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      workoutsThisWeek: getWorkoutsThisWeek(history),
      averageVolume: getAverageWorkoutVolume(history),
      bestVolumeWorkout: getBestVolumeWorkout(history),
      mostFrequentExercise: getMostFrequentExercise(history),
      mostTrainedMuscleGroup: getMostTrainedMuscleGroup(history),
      currentStreak: getCurrentTrainingStreak(history),
      weeklyActivity: getWeeklyActivity(history),
      muscleGroupStats,
      topPRs: getTopExercisePRs(history, 5),
      latestWorkout: history[0],
      runStats,
      hybridStats,
      maxMuscleVolume: Math.max(...muscleGroupStats.map((stat) => stat.totalVolume), 0),
      maxMuscleSets: Math.max(...muscleGroupStats.map((stat) => stat.totalSets), 0),
    };
  }, [history, runs, hybridSessions]);

  const handleStartWorkout = () => {
    router.push('/workout/active');
  };

  const handleLogRun = () => {
    router.push('/run/log');
  };

  const handleStartHybrid = () => {
    router.push('/hybrid/start');
  };

  const hasAnyProgress =
    analytics.totalWorkouts > 0 ||
    analytics.runStats.totalRuns > 0 ||
    analytics.hybridStats.totalSessions > 0;

  return (
    <ScreenContainer>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>See how your lifting, conditioning, and consistency are moving.</Text>

      {!historyLoaded || !runsLoaded || !hybridSessionsLoaded ? (
        <AppCard style={styles.topCard}>
          <Text style={styles.placeholder}>Loading progress data...</Text>
        </AppCard>
      ) : !hasAnyProgress ? (
        <EmptyProgressState
          onStartWorkout={handleStartWorkout}
          onLogRun={handleLogRun}
          onStartHybrid={handleStartHybrid}
        />
      ) : (
        <>
          <View style={styles.statGrid}>
            <View style={styles.statRow}>
              <StatCard
                label="Total Workouts"
                value={String(analytics.totalWorkouts)}
                hint="all time"
                accent="gold"
              />
              <View style={styles.statSpacer} />
              <StatCard
                label="This Week"
                value={String(analytics.workoutsThisWeek)}
                hint="calendar week"
                accent="primary"
              />
            </View>

            <View style={styles.statRow}>
              <StatCard
                label="Total Volume"
                value={formatCompactVolume(analytics.totalVolume)}
                hint="completed sets"
                accent="tech"
              />
              <View style={styles.statSpacer} />
              <StatCard
                label="Total Sets"
                value={analytics.totalSets.toLocaleString()}
                hint="logged sets"
                accent="success"
              />
            </View>
          </View>

          <View style={styles.secondaryGrid}>
            <MiniMetricCard
              label="Most Trained"
              value={analytics.mostTrainedMuscleGroup?.muscleGroup ?? '—'}
              hint={
                analytics.mostTrainedMuscleGroup
                  ? `${analytics.mostTrainedMuscleGroup.totalSets} sets`
                  : 'no sets yet'
              }
              icon="body-outline"
              accentColor={colors.gold}
            />
            <MiniMetricCard
              label="Avg Volume"
              value={formatCompactVolume(analytics.averageVolume)}
              hint="per workout"
              icon="analytics-outline"
              accentColor={colors.tech}
            />
            <MiniMetricCard
              label="Best Workout"
              value={
                analytics.bestVolumeWorkout
                  ? formatCompactVolume(analytics.bestVolumeWorkout.totalVolume)
                  : '—'
              }
              hint={analytics.bestVolumeWorkout?.workout.title ?? 'no workout yet'}
              icon="trophy-outline"
              accentColor={colors.success}
            />
            <MiniMetricCard
              label="Streak"
              value={`${analytics.currentStreak}`}
              hint={analytics.currentStreak === 1 ? 'day' : 'days'}
              icon="flame-outline"
              accentColor={colors.primary}
            />
          </View>

          <SectionHeader title="Running Snapshot" />
          <RunProgressCard stats={analytics.runStats} />

          {analytics.hybridStats.totalSessions > 0 ? (
            <>
              <SectionHeader title="Hybrid Snapshot" />
              <HybridProgressCard stats={analytics.hybridStats} />
            </>
          ) : null}

          {analytics.totalWorkouts > 0 ? (
            <>
              <SectionHeader title="Weekly Activity" />
              <WeeklyActivityCard days={analytics.weeklyActivity} />

              <SectionHeader title="Volume by Muscle Group" />
              <MuscleGroupCard
                stats={analytics.muscleGroupStats}
                maxVolume={analytics.maxMuscleVolume}
                maxSets={analytics.maxMuscleSets}
              />

              <SectionHeader title="Exercise PRs" />
              <ExercisePRCard prs={analytics.topPRs} />

              <SectionHeader title="Progress Highlights" />
              <HighlightsCard
                biggestWorkout={
                  analytics.bestVolumeWorkout
                    ? `${analytics.bestVolumeWorkout.workout.title} • ${formatCompactVolume(
                        analytics.bestVolumeWorkout.totalVolume
                      )}`
                    : 'No volume yet'
                }
                mostFrequentExercise={
                  analytics.mostFrequentExercise
                    ? `${analytics.mostFrequentExercise.exerciseName} • ${analytics.mostFrequentExercise.appearances}x`
                    : 'No exercises yet'
                }
                mostTrainedMuscleGroup={
                  analytics.mostTrainedMuscleGroup
                    ? `${analytics.mostTrainedMuscleGroup.muscleGroup} • ${analytics.mostTrainedMuscleGroup.totalSets} sets`
                    : 'No sets yet'
                }
                latestWorkout={
                  analytics.latestWorkout
                    ? `${analytics.latestWorkout.title} • ${formatRelativeDate(
                        analytics.latestWorkout.date
                      )}`
                    : 'No workouts yet'
                }
              />
            </>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}

function EmptyProgressState({
  onStartWorkout,
  onLogRun,
  onStartHybrid,
}: {
  onStartWorkout: () => void;
  onLogRun: () => void;
  onStartHybrid: () => void;
}) {
  return (
    <AppCard elevated tint="hybrid" style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name="stats-chart-outline" size={28} color={colors.tech} />
      </View>
      <Text style={styles.emptyTitle}>Log your first workout, run, or hybrid session to unlock progress tracking.</Text>
      <Text style={styles.emptySub}>ReviveX will track volume, mileage, sets, pace, hybrid sessions, PRs, and trends here.</Text>
      <PrimaryButton
        label="Start Workout"
        variant="primary"
        onPress={onStartWorkout}
        style={styles.emptyButton}
      />
      <PrimaryButton
        label="Log Run"
        variant="outline"
        onPress={onLogRun}
        style={styles.emptySecondaryButton}
      />
      <PrimaryButton
        label="Start Hybrid Session"
        variant="outline"
        onPress={onStartHybrid}
        style={styles.emptySecondaryButton}
      />
    </AppCard>
  );
}

function RunProgressCard({ stats }: { stats: ReturnType<typeof calculateRunStats> }) {
  return (
    <AppCard>
      <View style={styles.runSnapshotGrid}>
        <RunSnapshotMetric
          label="Run Distance"
          value={`${stats.totalDistanceMiles.toFixed(1)} mi`}
          hint="all time"
          icon="walk-outline"
          color={colors.accentTeal}
        />
        <RunSnapshotMetric
          label="Runs This Week"
          value={String(stats.runsThisWeek)}
          hint={`${stats.weeklyMileageMiles.toFixed(1)} mi`}
          icon="calendar-outline"
          color={colors.techCool}
        />
        <RunSnapshotMetric
          label="Best Pace"
          value={`${formatPace(stats.bestPace?.paceSecondsPerMile)}/mi`}
          hint={stats.bestPace?.title ?? 'no pace yet'}
          icon="speedometer-outline"
          color={colors.accentLime}
        />
        <RunSnapshotMetric
          label="Longest Run"
          value={
            stats.longestRun
              ? formatDistance(stats.longestRun.distance, stats.longestRun.distanceUnit)
              : '—'
          }
          hint={stats.longestRun?.title ?? 'no runs yet'}
          icon="trail-sign-outline"
          color={colors.success}
        />
      </View>
    </AppCard>
  );
}

function RunSnapshotMetric({
  label,
  value,
  hint,
  icon,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.runSnapshotMetric}>
      <View style={styles.runSnapshotHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.runSnapshotLabel}>{label}</Text>
      </View>
      <Text style={styles.runSnapshotValue}>{value}</Text>
      <Text style={styles.runSnapshotHint} numberOfLines={1}>{hint}</Text>
    </View>
  );
}

function HybridProgressCard({ stats }: { stats: ReturnType<typeof getHybridSessionStats> }) {
  return (
    <AppCard>
      <View style={styles.runSnapshotGrid}>
        <RunSnapshotMetric
          label="Hybrid Sessions"
          value={String(stats.totalSessions)}
          hint="all time"
          icon="flash-outline"
          color={colors.accentLime}
        />
        <RunSnapshotMetric
          label="Best Time"
          value={stats.bestSession ? formatSegmentTime(stats.bestSession.totalDurationSeconds) : '—'}
          hint={stats.bestSession?.title ?? 'no time yet'}
          icon="trophy-outline"
          color={colors.success}
        />
        <RunSnapshotMetric
          label="Average Time"
          value={stats.averageSessionTime > 0 ? formatSegmentTime(stats.averageSessionTime) : '—'}
          hint="timed sessions"
          icon="timer-outline"
          color={colors.accentTeal}
        />
        <RunSnapshotMetric
          label="Latest"
          value={stats.latestSession ? formatSegmentTime(stats.latestSession.totalDurationSeconds) : '—'}
          hint={stats.latestSession?.title ?? 'no sessions yet'}
          icon="calendar-outline"
          color={colors.techCool}
        />
      </View>
    </AppCard>
  );
}

function MiniMetricCard({
  label,
  value,
  hint,
  icon,
  accentColor,
}: {
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
}) {
  return (
    <AppCard style={styles.miniCard}>
      <View style={styles.miniHeader}>
        <Ionicons name={icon} size={16} color={accentColor} />
        <Text style={styles.miniLabel}>{label}</Text>
      </View>
      <Text style={styles.miniValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.miniHint} numberOfLines={1}>
        {hint}
      </Text>
    </AppCard>
  );
}

function WeeklyActivityCard({ days }: { days: ReturnType<typeof getWeeklyActivity> }) {
  const maxSets = Math.max(...days.map((day) => day.totalSets), 1);

  return (
    <AppCard>
      <View style={styles.weekRow}>
        {days.map((day) => {
          const hasWorkout = day.workoutCount > 0;
          const barHeight = Math.max(6, Math.round((day.totalSets / maxSets) * 54));

          return (
            <View key={day.dateKey} style={styles.dayCard}>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
              <View style={styles.dayBarTrack}>
                <View
                  style={[
                    styles.dayBarFill,
                    {
                      height: barHeight,
                      backgroundColor: hasWorkout ? colors.tech : colors.border,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.daySets, hasWorkout && styles.daySetsActive]}>
                {day.totalSets}
              </Text>
              <Text style={styles.dayUnit}>sets</Text>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

function MuscleGroupCard({
  stats,
  maxVolume,
  maxSets,
}: {
  stats: MuscleGroupStat[];
  maxVolume: number;
  maxSets: number;
}) {
  const usesVolumeBars = maxVolume > 0;
  const maxValue = usesVolumeBars ? maxVolume : Math.max(maxSets, 1);

  return (
    <AppCard>
      {stats.map((stat, index) => {
        const barValue = usesVolumeBars ? stat.totalVolume : stat.totalSets;
        const percent = maxValue > 0 ? Math.min(100, Math.round((barValue / maxValue) * 100)) : 0;

        return (
          <View
            key={stat.muscleGroup}
            style={[
              styles.muscleRow,
              index !== stats.length - 1 && styles.rowDivider,
            ]}
          >
            <View style={styles.muscleTopRow}>
              <Text style={styles.rowTitle}>{stat.muscleGroup}</Text>
              <Text style={styles.rowMeta}>
                {stat.totalSets} sets • {formatVolume(stat.totalVolume)}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percent}%`,
                    backgroundColor: stat.totalVolume > 0 ? colors.gold : colors.tech,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </AppCard>
  );
}

function ExercisePRCard({ prs }: { prs: ExercisePR[] }) {
  if (prs.length === 0) {
    return (
      <AppCard>
        <Text style={styles.placeholder}>
          Complete weighted sets to start seeing PRs here.
        </Text>
      </AppCard>
    );
  }

  return (
    <AppCard>
      {prs.map((pr, index) => (
        <View
          key={`${pr.exerciseId}-${pr.exerciseName}`}
          style={[styles.prRow, index !== prs.length - 1 && styles.rowDivider]}
        >
          <View style={styles.prRank}>
            <Text style={styles.prRankText}>{index + 1}</Text>
          </View>
          <View style={styles.prContent}>
            <Text style={styles.rowTitle}>{pr.exerciseName}</Text>
            <Text style={styles.rowSub}>
              {pr.muscleGroup} • {formatRelativeDate(pr.date)}
            </Text>
          </View>
          <View style={styles.prResult}>
            <Text style={styles.prWeight}>{formatWeight(pr.weight)}</Text>
            <Text style={styles.prReps}>x {pr.reps}</Text>
          </View>
        </View>
      ))}
    </AppCard>
  );
}

function HighlightsCard({
  biggestWorkout,
  mostFrequentExercise,
  mostTrainedMuscleGroup,
  latestWorkout,
}: {
  biggestWorkout: string;
  mostFrequentExercise: string;
  mostTrainedMuscleGroup: string;
  latestWorkout: string;
}) {
  const highlights = [
    {
      label: 'Biggest workout by volume',
      value: biggestWorkout,
      icon: 'trending-up-outline' as const,
      color: colors.tech,
    },
    {
      label: 'Most frequent exercise',
      value: mostFrequentExercise,
      icon: 'repeat-outline' as const,
      color: colors.gold,
    },
    {
      label: 'Most trained muscle group',
      value: mostTrainedMuscleGroup,
      icon: 'body-outline' as const,
      color: colors.primary,
    },
    {
      label: 'Latest workout completed',
      value: latestWorkout,
      icon: 'checkmark-circle-outline' as const,
      color: colors.success,
    },
  ];

  return (
    <AppCard style={styles.bottomCard}>
      {highlights.map((highlight, index) => (
        <View
          key={highlight.label}
          style={[styles.highlightRow, index !== highlights.length - 1 && styles.rowDivider]}
        >
          <Ionicons name={highlight.icon} size={18} color={highlight.color} />
          <View style={styles.highlightText}>
            <Text style={styles.highlightLabel}>{highlight.label}</Text>
            <Text style={styles.highlightValue} numberOfLines={1}>
              {highlight.value}
            </Text>
          </View>
        </View>
      ))}
    </AppCard>
  );
}

function formatCompactVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M kg`;
  if (volume >= 10_000) return `${Math.round(volume / 1_000).toLocaleString()}k kg`;
  return formatVolume(volume);
}

function formatWeight(weight: number): string {
  const rounded = Number.isInteger(weight) ? weight.toFixed(0) : weight.toFixed(1);
  return `${rounded} kg`;
}

const styles = StyleSheet.create({
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
  topCard: {
    marginTop: spacing.lg,
  },
  statGrid: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
  },
  statSpacer: {
    width: spacing.md,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  miniCard: {
    width: '48%',
    minHeight: 118,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  miniValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  miniHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.cyanFaint,
    borderWidth: 1,
    borderColor: glow.cyanStrong,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
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
  emptySecondaryButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  runSnapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  runSnapshotMetric: {
    width: '48%',
    minHeight: 104,
  },
  runSnapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  runSnapshotLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  runSnapshotValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  runSnapshotHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    minHeight: 116,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  dayBarTrack: {
    height: 58,
    width: 10,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  dayBarFill: {
    width: 10,
    borderRadius: radius.pill,
  },
  daySets: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  daySetsActive: {
    color: colors.textPrimary,
  },
  dayUnit: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  muscleRow: {
    paddingVertical: spacing.md,
  },
  muscleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'right',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  progressTrack: {
    height: 7,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: radius.pill,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  prRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.successFaint,
    borderWidth: 1,
    borderColor: colors.success,
  },
  prRankText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  prContent: {
    flex: 1,
  },
  prResult: {
    alignItems: 'flex-end',
  },
  prWeight: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  prReps: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  highlightText: {
    flex: 1,
  },
  highlightLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  highlightValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 2,
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
});
