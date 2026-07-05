import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import HealthMetricsCard from '../../src/components/HealthMetricsCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useHybridSessions } from '../../src/context/HybridContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatFullDate, formatRelativeDate } from '../../src/utils/format';
import {
  formatHybridDistance,
  formatSegmentTime,
  getRunVsStationTime,
} from '../../src/utils/hybridStats';
import type { HybridSegment } from '../../src/types';

export default function HybridDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { deleteHybridSession, getHybridSessionById } = useHybridSessions();
  const session = id ? getHybridSessionById(id) : undefined;

  const handleDelete = () => {
    if (!session) return;

    Alert.alert(
      'Delete Hybrid Session?',
      'This hybrid session will be permanently removed from your local history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteHybridSession(session.id);
            router.replace('/hybrid/history');
          },
        },
      ]
    );
  };

  const openShareCard = () => {
    if (!session) return;
    router.push({
      pathname: '/share/[type]/[id]',
      params: { type: 'hybrid', id: session.id },
    });
  };

  const openEditSession = () => {
    if (!session) return;
    router.push({ pathname: '/hybrid/edit/[id]', params: { id: session.id } });
  };

  if (!id || !session) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>Hybrid session not found</Text>
          <Text style={styles.emptyText}>
            This session may have been deleted or is no longer available.
          </Text>
          <PrimaryButton
            label="Back to Hybrid"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  const completedSegments = session.segments.filter((segment) => segment.durationSeconds > 0).length;
  const runVsStation = getRunVsStationTime([session]);

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.md }}>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{session.sessionType}</Text>
        </View>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.subtitle}>{formatRelativeDate(session.date)}</Text>

        <View style={styles.heroGrid}>
          <Metric label="Total Time" value={formatSegmentTime(session.totalDurationSeconds)} />
          <Metric label="Segments" value={`${completedSegments}/${session.segments.length}`} />
          <Metric label="Run/Station" value={`${formatSegmentTime(runVsStation.runTotalTime)} / ${formatSegmentTime(runVsStation.stationTotalTime)}`} />
        </View>
      </AppCard>

      <HealthMetricsCard dateIso={session.date} durationSeconds={session.totalDurationSeconds} />

      <AppCard style={{ marginTop: spacing.md }}>
        <DetailRow label="Date" value={formatFullDate(session.date)} />
        <DetailRow label="Session Type" value={session.sessionType} />
        {session.notes ? <DetailRow label="Notes" value={session.notes} multiline /> : null}
      </AppCard>

      <Text style={styles.sectionTitle}>Segment Breakdown</Text>
      <AppCard>
        {session.segments.map((segment, index) => (
          <SegmentRow
            key={segment.id}
            segment={segment}
            divider={index !== session.segments.length - 1}
          />
        ))}
      </AppCard>

      <PrimaryButton
        label="Edit Hybrid Session"
        variant="outline"
        onPress={openEditSession}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="View Share Card"
        variant="tech"
        onPress={openShareCard}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="Delete Hybrid Session"
        variant="outline"
        onPress={handleDelete}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
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

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.detailRow, multiline && styles.detailRowMultiline]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>{value}</Text>
    </View>
  );
}

function SegmentRow({
  segment,
  divider,
}: {
  segment: HybridSegment;
  divider: boolean;
}) {
  const isRun = segment.segmentType === 'run';

  return (
    <View style={[styles.segmentRow, divider && styles.rowDivider]}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentBadge}>
          <Text style={styles.segmentBadgeText}>{segment.order}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.segmentName}>{segment.name}</Text>
          <Text style={styles.segmentMeta}>
            {isRun ? 'Run' : 'Station'} • {formatSegmentTime(segment.durationSeconds)}
            {isRun ? ` • ${formatHybridDistance(segment.distance, segment.distanceUnit)}` : ''}
          </Text>
          {segment.notes ? <Text style={styles.segmentNotes}>{segment.notes}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    borderWidth: 1,
    borderColor: colors.accentLime,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typePillText: {
    color: colors.accentLime,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  heroGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  detailRowMultiline: {
    flexDirection: 'column',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'right',
    flex: 1,
  },
  detailValueMultiline: {
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'left',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  segmentRow: {
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  segmentBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 179, 0.24)',
  },
  segmentBadgeText: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  segmentName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  segmentMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 3,
  },
  segmentNotes: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
