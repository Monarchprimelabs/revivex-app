import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import StatCard from '../../src/components/StatCard';
import { useHybridSessions } from '../../src/context/HybridContext';
import { HYROX_RACE_SEGMENTS } from '../../src/data/hybridTemplates';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';
import {
  formatSegmentTime,
  getHybridSessionStats,
  getRecentHybridSessions,
} from '../../src/utils/hybridStats';
import type { HybridSession, HybridSessionType } from '../../src/types';

/**
 * Hybrid screen
 * Manual race-style session tracker. GPS and advanced scoring arrive later.
 */
export default function HybridScreen() {
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();

  const stats = useMemo(() => getHybridSessionStats(hybridSessions), [hybridSessions]);
  const recentSessions = useMemo(
    () => getRecentHybridSessions(hybridSessions, 3),
    [hybridSessions]
  );

  const startSession = (sessionType?: HybridSessionType) => {
    if (sessionType) {
      router.push({ pathname: '/hybrid/start', params: { sessionType } });
      return;
    }
    router.push('/hybrid/start');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Hybrid</Text>
      <Text style={styles.subtitle}>Run, lift, condition, and rebuild your engine.</Text>

      <PrimaryButton
        label="Start Hybrid Session"
        variant="primary"
        onPress={() => startSession()}
        style={{ marginTop: spacing.lg }}
      />

      {!hybridSessionsLoaded ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>Loading hybrid sessions...</Text>
        </AppCard>
      ) : (
        <>
          <View style={styles.statRow}>
            <StatCard
              label="Sessions"
              value={String(stats.totalSessions)}
              hint="all time"
              accent="accent"
            />
            <View style={{ width: spacing.md }} />
            <StatCard
              label="Best Time"
              value={stats.bestSession ? formatSegmentTime(stats.bestSession.totalDurationSeconds) : '—'}
              hint={stats.bestSession?.title ?? 'no saved time'}
              accent="tech"
            />
          </View>

          <View style={[styles.statRow, { marginTop: spacing.md }]}>
            <StatCard
              label="Average"
              value={stats.averageSessionTime > 0 ? formatSegmentTime(stats.averageSessionTime) : '—'}
              hint="timed sessions"
              accent="techCool"
            />
            <View style={{ width: spacing.md }} />
            <StatCard
              label="Latest"
              value={stats.latestSession ? formatRelativeDate(stats.latestSession.date) : '—'}
              hint={stats.latestSession?.title ?? 'track a session'}
              accent="textPrimary"
            />
          </View>
        </>
      )}

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Race simulator</Text>
        <Text style={styles.cardTitle}>HYROX Race Sim</Text>
        <Text style={styles.cardSub}>8 runs • 8 stations • manual segment timing</Text>
        <PrimaryButton
          label="Start Race Sim"
          variant="accent"
          onPress={() => startSession('HYROX Race Sim')}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      <AppCard style={{ marginTop: spacing.md }}>
        <Text style={styles.cardLabel}>Benchmark</Text>
        <Text style={styles.cardTitle}>Hybrid Benchmark</Text>
        <Text style={styles.cardSub}>Run, erg, push, carry, lunge, wall balls</Text>
        <PrimaryButton
          label="Start Benchmark"
          variant="outline"
          onPress={() => startSession('Hybrid Benchmark')}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      <SectionHeader
        title="Recent Hybrid Sessions"
        actionLabel={hybridSessions.length > 0 ? 'See all' : undefined}
        onActionPress={() => router.push('/hybrid/history')}
      />
      {recentSessions.length === 0 ? (
        <AppCard>
          <View style={styles.emptyIcon}>
            <Ionicons name="flash-outline" size={26} color={colors.accentCoral} />
          </View>
          <Text style={styles.emptyTitle}>Track your first hybrid session to measure your engine.</Text>
          <PrimaryButton
            label="Start Hybrid Session"
            variant="primary"
            onPress={() => startSession()}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      ) : (
        recentSessions.map((session) => (
          <HybridSessionCard key={session.id} session={session} />
        ))
      )}

      <SectionHeader title="HYROX Station Preview" />
      <AppCard>
        {HYROX_RACE_SEGMENTS.filter((segment) => segment.segmentType === 'station').map(
          (station, idx, stations) => (
            <View
              key={station.name}
              style={[
                styles.stationRow,
                idx !== stations.length - 1 && styles.divider,
              ]}
            >
              <View style={styles.stationBadge}>
                <Text style={styles.stationBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stationName}>{station.name}</Text>
            </View>
          )
        )}
      </AppCard>
    </ScreenContainer>
  );
}

function HybridSessionCard({ session }: { session: HybridSession }) {
  const completedSegments = session.segments.filter((segment) => segment.durationSeconds > 0).length;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/hybrid/[id]', params: { id: session.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.itemHeader}>
          <View style={styles.itemIcon}>
            <Ionicons name="flash-outline" size={18} color={colors.accentCoral} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{session.title}</Text>
            <Text style={styles.itemSub}>
              {session.sessionType} • {formatRelativeDate(session.date)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.sessionMetaRow}>
          <MiniStat label="Time" value={formatSegmentTime(session.totalDurationSeconds)} />
          <MiniStat label="Segments" value={`${completedSegments}/${session.segments.length}`} />
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
  statRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.22)',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  itemSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  sessionMetaRow: {
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
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stationBadgeText: {
    color: colors.accentCoral,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  stationName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
