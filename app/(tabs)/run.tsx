import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import StatCard from '../../src/components/StatCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import RouteMap from '../../src/components/RouteMap';
import { useRuns } from '../../src/context/RunContext';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';
import {
  calculateRunStats,
  formatDistance,
  formatPace,
  formatRunDuration,
  getRecentRuns,
} from '../../src/utils/runStats';
import type { Run } from '../../src/types';

/**
 * Run screen
 * Manual run logging hub. GPS arrives in a later phase.
 */
export default function RunScreen() {
  const { runs, runsLoaded } = useRuns();

  const stats = useMemo(() => calculateRunStats(runs), [runs]);
  const recentRuns = useMemo(() => getRecentRuns(runs, 3), [runs]);

  const handleLogRun = () => {
    router.push('/run/log');
  };

  const handleHistory = () => {
    router.push('/run/history');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Run</Text>
      <Text style={styles.subtitle}>Track miles, engine work, and aerobic progress.</Text>

      <PrimaryButton
        label="Start Run"
        variant="primary"
        onPress={() => router.push('/run/track')}
        style={{ marginTop: spacing.lg }}
      />

      <PrimaryButton
        label="Manual Run Log"
        variant="tech"
        onPress={handleLogRun}
        style={{ marginTop: spacing.md }}
      />

      {!runsLoaded ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>Loading runs...</Text>
        </AppCard>
      ) : runs.length === 0 ? (
        <EmptyRunState onLogRun={handleLogRun} />
      ) : (
        <>
          <View style={styles.row}>
            <StatCard
              label="Weekly mileage"
              value={`${stats.weeklyMileageMiles.toFixed(1)} mi`}
              hint="this week"
              accent="tech"
            />
            <View style={{ width: spacing.md }} />
            <StatCard
              label="Runs"
              value={`${stats.runsThisWeek}`}
              hint="this week"
              accent="textPrimary"
            />
          </View>

          <View style={[styles.row, { marginTop: spacing.md }]}>
            <StatCard
              label="Avg Pace"
              value={`${formatPace(stats.averagePaceSecondsPerMile)}/mi`}
              hint="all logged runs"
              accent="techCool"
            />
            <View style={{ width: spacing.md }} />
            <StatCard
              label="Longest"
              value={
                stats.longestRun
                  ? formatDistance(stats.longestRun.distance, stats.longestRun.distanceUnit)
                  : '—'
              }
              hint="best distance"
              accent="gold"
            />
          </View>

          <SectionHeader title="Recent runs" actionLabel="See all" onActionPress={handleHistory} />
          {recentRuns.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}

          <SectionHeader title="Running PRs" />
          <View style={styles.prGrid}>
            <PRCard
              label="Longest Run"
              value={
                stats.longestRun
                  ? formatDistance(stats.longestRun.distance, stats.longestRun.distanceUnit)
                  : '—'
              }
              hint={stats.longestRun?.title ?? 'Log more runs'}
              icon="trail-sign-outline"
              color={colors.accentLime}
            />
            <PRCard
              label="Best Pace"
              value={
                stats.bestPace
                  ? `${formatPace(stats.bestPace.paceSecondsPerMile)}/mi`
                  : '—'
              }
              hint={stats.bestPace?.title ?? 'No pace yet'}
              icon="speedometer-outline"
              color={colors.accentTeal}
            />
            <PRCard
              label="Fastest 5K"
              value={
                stats.fastest5K
                  ? `${formatPace(stats.fastest5K.paceSecondsPerKm)}/km`
                  : '—'
              }
              hint={stats.fastest5K ? 'estimated from avg pace' : 'needs 5K+ run'}
              icon="trophy-outline"
              color={colors.success}
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function EmptyRunState({ onLogRun }: { onLogRun: () => void }) {
  return (
    <AppCard elevated tint="tech" style={{ marginTop: spacing.lg }}>
      <View style={styles.emptyIcon}>
        <Ionicons name="walk-outline" size={28} color={colors.accentTeal} />
      </View>
      <Text style={styles.emptyTitle}>Track your first run to start measuring mileage, pace, and endurance.</Text>
      <PrimaryButton
        label="Start Run"
        variant="primary"
        onPress={() => router.push('/run/track')}
        style={{ marginTop: spacing.lg }}
      />
      <PrimaryButton
        label="Log Run Manually"
        variant="outline"
        onPress={onLogRun}
        style={{ marginTop: spacing.md }}
      />
    </AppCard>
  );
}

function RunCard({ run }: { run: Run }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/run/[id]', params: { id: run.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.runHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{run.title}</Text>
            <Text style={styles.itemSub}>
              {run.runType} • {formatRelativeDate(run.date)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        {run.routePoints && run.routePoints.length > 1 ? (
          <View style={{ marginTop: spacing.md }}>
            <RouteMap routePoints={run.routePoints} height={96} />
          </View>
        ) : null}

        <View style={styles.runStatsRow}>
          <MiniStat label="Distance" value={formatDistance(run.distance, run.distanceUnit)} />
          <MiniStat label="Time" value={formatRunDuration(run.durationSeconds)} />
          <MiniStat
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function PRCard({
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
    <AppCard style={styles.prCard}>
      <View style={styles.prHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={styles.prLabel}>{label}</Text>
      </View>
      <Text style={styles.prValue}>{value}</Text>
      <Text style={styles.prHint} numberOfLines={1}>
        {hint}
      </Text>
    </AppCard>
  );
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
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 179, 0.24)',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
  },
  runHeader: {
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
  runStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  miniStat: {
    flex: 1,
  },
  miniStatValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  miniStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  prGrid: {
    gap: spacing.md,
  },
  prCard: {
    marginBottom: spacing.md,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  prValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  prHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
