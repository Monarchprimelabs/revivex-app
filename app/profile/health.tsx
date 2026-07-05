import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import { useHealth } from '../../src/context/HealthContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';

export default function HealthSyncScreen() {
  const {
    status,
    providerName,
    connected,
    settings,
    syncedCount,
    pendingCount,
    lastSyncAt,
    connect,
    disconnect,
    updateSettings,
    syncNow,
  } = useHealth();

  const statusInfo = getStatusInfo(status, providerName, connected);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Health Sync</Text>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppCard elevated tint="hybrid">
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIcon,
                { borderColor: statusInfo.color, backgroundColor: statusInfo.faint },
              ]}
            >
              <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{statusInfo.title}</Text>
              <Text style={styles.statusSub}>{statusInfo.subtitle}</Text>
            </View>
          </View>

          {status === 'available' && !connected ? (
            <PrimaryButton
              label={`Connect ${providerName}`}
              variant="primary"
              onPress={connect}
              style={{ marginTop: spacing.lg }}
            />
          ) : null}
        </AppCard>

        {status === 'needs-dev-build' ? (
          <AppCard style={{ marginTop: spacing.md }}>
            <Text style={styles.devBuildTitle}>Why is this off in Expo Go?</Text>
            <Text style={styles.devBuildText}>
              {providerName} is a native capability that Expo Go can't load. ReviveX is
              already fully wired for it — workouts, runs, and hybrid sessions will sync
              automatically once the app runs as a development or production build. Sessions
              recorded on your watch land in {providerName} and stay in sync with your
              training log there.
            </Text>
          </AppCard>
        ) : null}

        {connected ? (
          <>
            <View style={styles.summaryCard}>
              <SummaryMetric label="Synced" value={String(syncedCount)} />
              <SummaryMetric label="Pending" value={String(pendingCount)} />
              <SummaryMetric
                label="Last Sync"
                value={lastSyncAt ? formatRelativeDate(lastSyncAt) : '—'}
              />
            </View>

            <SectionHeader title="What syncs" />
            <AppCard>
              <ToggleRow
                label="Strength workouts"
                hint="Saved as strength training sessions"
                icon="barbell-outline"
                value={settings.syncWorkouts}
                onValueChange={(syncWorkouts) => updateSettings({ syncWorkouts })}
              />
              <ToggleRow
                label="Runs"
                hint="Saved as running workouts with distance"
                icon="walk-outline"
                value={settings.syncRuns}
                onValueChange={(syncRuns) => updateSettings({ syncRuns })}
                divider
              />
              <ToggleRow
                label="Hybrid sessions"
                hint="Saved as high-intensity interval training"
                icon="flash-outline"
                value={settings.syncHybrid}
                onValueChange={(syncHybrid) => updateSettings({ syncHybrid })}
                divider
              />
            </AppCard>

            <PrimaryButton
              label={pendingCount > 0 ? `Sync ${pendingCount} Now` : 'Everything Synced'}
              variant="primary"
              onPress={syncNow}
              style={{ marginTop: spacing.lg }}
            />
            <PrimaryButton
              label="Disconnect"
              variant="outline"
              onPress={disconnect}
              style={{ marginTop: spacing.md }}
            />
            <Text style={styles.disconnectHint}>
              Disconnecting stops new syncing. Data already written to {providerName} stays
              there, and OS-level permissions are managed in the {providerName} app.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusInfo(
  status: string,
  providerName: string,
  connected: boolean
): {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  faint: string;
} {
  if (connected && status === 'available') {
    return {
      title: `${providerName} connected`,
      subtitle: 'New workouts, runs, and hybrid sessions sync automatically.',
      icon: 'heart-circle',
      color: colors.success,
      faint: glow.successFaint,
    };
  }
  switch (status) {
    case 'available':
      return {
        title: `${providerName} is ready`,
        subtitle: `Connect to sync your training into ${providerName}.`,
        icon: 'heart-circle-outline',
        color: colors.accentTeal,
        faint: glow.tealFaint,
      };
    case 'needs-dev-build':
      return {
        title: `${providerName} needs the dev build`,
        subtitle: 'Health sync is wired up but dormant inside Expo Go.',
        icon: 'construct-outline',
        color: colors.gold,
        faint: glow.goldFaint,
      };
    case 'checking':
      return {
        title: 'Checking availability...',
        subtitle: `Looking for ${providerName} on this device.`,
        icon: 'sync-outline',
        color: colors.textMuted,
        faint: colors.surfaceAlt,
      };
    default:
      return {
        title: `${providerName} unavailable`,
        subtitle: 'This device does not support a health store.',
        icon: 'close-circle-outline',
        color: colors.textMuted,
        faint: colors.surfaceAlt,
      };
  }
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

function ToggleRow({
  label,
  hint,
  icon,
  value,
  onValueChange,
  divider,
}: {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: (value: boolean) => void;
  divider?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, divider && styles.rowDivider]}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={18} color={colors.accentTeal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.accentTeal }}
        thumbColor={colors.textPrimary}
      />
    </View>
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statusSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  devBuildTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  devBuildText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.tealFaint,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  disconnectHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
});
