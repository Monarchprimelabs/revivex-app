import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import HealthMetricsCard from '../../src/components/HealthMetricsCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useRuns } from '../../src/context/RunContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatFullDate, formatRelativeDate } from '../../src/utils/format';
import { formatDistance, formatPace, formatRunDuration } from '../../src/utils/runStats';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { deleteRun, getRunById } = useRuns();
  const run = id ? getRunById(id) : undefined;

  const handleDelete = () => {
    if (!run) return;

    Alert.alert('Delete Run?', 'This run will be permanently removed from your local history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRun(run.id);
          router.replace('/run/history');
        },
      },
    ]);
  };

  const openShareCard = () => {
    if (!run) return;
    router.push({
      pathname: '/share/[type]/[id]',
      params: { type: 'run', id: run.id },
    });
  };

  const openEditRun = () => {
    if (!run) return;
    router.push({ pathname: '/run/edit/[id]', params: { id: run.id } });
  };

  if (!id || !run) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>Run not found</Text>
          <Text style={styles.emptyText}>
            This run may have been deleted or is no longer available.
          </Text>
          <PrimaryButton
            label="Back to Runs"
            variant="outline"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  const displayPace =
    run.distanceUnit === 'mi' ? run.paceSecondsPerMile : run.paceSecondsPerKm;

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <AppCard elevated tint="tech" style={{ marginTop: spacing.md }}>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{run.runType}</Text>
        </View>
        <Text style={styles.title}>{run.title}</Text>
        <Text style={styles.subtitle}>{formatRelativeDate(run.date)}</Text>

        <View style={styles.heroGrid}>
          <Metric label="Distance" value={formatDistance(run.distance, run.distanceUnit)} />
          <Metric label="Duration" value={formatRunDuration(run.durationSeconds)} />
          <Metric label="Pace" value={`${formatPace(displayPace)}/${run.distanceUnit}`} />
        </View>
      </AppCard>

      <HealthMetricsCard dateIso={run.date} durationSeconds={run.durationSeconds} />

      <AppCard style={{ marginTop: spacing.md }}>
        <DetailRow label="Date" value={formatFullDate(run.date)} />
        <DetailRow label="Run Type" value={run.runType} />
        {run.location ? <DetailRow label="Location" value={run.location} /> : null}
        {run.notes ? <DetailRow label="Notes" value={run.notes} multiline /> : null}
      </AppCard>

      <PrimaryButton
        label="Edit Run"
        variant="outline"
        onPress={openEditRun}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="View Share Card"
        variant="tech"
        onPress={openShareCard}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="Delete Run"
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
      <Text style={styles.metricValue}>{value}</Text>
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
    backgroundColor: 'rgba(0, 180, 179, 0.14)',
    borderWidth: 1,
    borderColor: colors.accentTeal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typePillText: {
    color: colors.accentTeal,
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
