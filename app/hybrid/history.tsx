import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useHybridSessions } from '../../src/context/HybridContext';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';
import { formatSegmentTime } from '../../src/utils/hybridStats';
import type { HybridSession } from '../../src/types';

export default function HybridHistoryScreen() {
  const { hybridSessions, hybridSessionsLoaded } = useHybridSessions();

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Hybrid History</Text>
          <Text style={styles.subtitle}>All saved engine sessions.</Text>
        </View>
      </View>

      <PrimaryButton
        label="Start Hybrid Session"
        variant="primary"
        onPress={() => router.push('/hybrid/start')}
        style={{ marginTop: spacing.lg }}
      />

      {!hybridSessionsLoaded ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>Loading hybrid sessions...</Text>
        </AppCard>
      ) : hybridSessions.length === 0 ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.placeholder}>
            Track your first hybrid session to measure your engine.
          </Text>
          <PrimaryButton
            label="Start Hybrid Session"
            variant="primary"
            onPress={() => router.push('/hybrid/start')}
            style={{ marginTop: spacing.md }}
          />
        </AppCard>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          {hybridSessions.map((session) => (
            <HybridHistoryCard key={session.id} session={session} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

function HybridHistoryCard({ session }: { session: HybridSession }) {
  const completedSegments = session.segments.filter((segment) => segment.durationSeconds > 0).length;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/hybrid/[id]', params: { id: session.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{session.title}</Text>
            <Text style={styles.itemSub}>
              {session.sessionType} • {formatRelativeDate(session.date)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.metricRow}>
          <Metric label="Total Time" value={formatSegmentTime(session.totalDurationSeconds)} />
          <Metric label="Segments" value={`${completedSegments}/${session.segments.length}`} />
          <Metric label="Type" value={session.sessionType.replace('Hybrid ', '')} />
        </View>
      </AppCard>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
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
    gap: spacing.md,
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
