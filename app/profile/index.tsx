import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useHybridSessions } from '../../src/context/HybridContext';
import { useProfile } from '../../src/context/ProfileContext';
import { useRuns } from '../../src/context/RunContext';
import { useWorkout } from '../../src/context/WorkoutContext';
import { formatWeeklyTarget } from '../../src/data/profileOptions';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { getWorkoutsThisWeek } from '../../src/utils/progress';
import { getRunsThisWeek } from '../../src/utils/runStats';

export default function ProfileScreen() {
  const { profile } = useProfile();
  const { history, routines } = useWorkout();
  const { runs } = useRuns();
  const { hybridSessions } = useHybridSessions();

  const sessionsThisWeek =
    getWorkoutsThisWeek(history) +
    getRunsThisWeek(runs) +
    hybridSessions.filter((session) => isThisWeek(session.date)).length;

  if (!profile) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>Profile not set up</Text>
          <Text style={styles.emptyText}>
            Create your local ReviveX profile to personalize your dashboard.
          </Text>
          <PrimaryButton
            label="Start Onboarding"
            variant="primary"
            onPress={() => router.replace('/onboarding')}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Local identity and training preferences.</Text>
        </View>
      </View>

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.lg }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile.displayName}</Text>
        {profile.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
        <View style={styles.focusPill}>
          <Text style={styles.focusPillText}>{profile.trainingFocus}</Text>
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetValue}>
            {Math.min(sessionsThisWeek, profile.weeklyTrainingTarget)} / {profile.weeklyTrainingTarget}
          </Text>
          <Text style={styles.targetLabel}>sessions this week</Text>
        </View>
      </AppCard>

      <PrimaryButton
        label="Edit Profile"
        variant="primary"
        onPress={() => router.push('/profile/edit')}
        style={{ marginTop: spacing.md }}
      />

      <View style={styles.statGrid}>
        <StatBox label="Workouts" value={String(history.length)} icon="barbell-outline" />
        <StatBox label="Runs" value={String(runs.length)} icon="walk-outline" />
        <StatBox label="Hybrid" value={String(hybridSessions.length)} icon="flash-outline" />
        <StatBox label="Routines" value={String(routines.length)} icon="repeat-outline" />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <AppCard>
        <DetailRow label="Primary goal" value={profile.primaryGoal} />
        <DetailRow label="Experience" value={profile.experienceLevel} />
        <DetailRow label="Weekly target" value={formatWeeklyTarget(profile.weeklyTrainingTarget)} />
        <DetailRow label="Weight unit" value={profile.preferredWeightUnit} />
        <DetailRow label="Distance unit" value={profile.preferredDistanceUnit} />
      </AppCard>

      <Text style={styles.sectionTitle}>Community</Text>
      <AppCard>
        <View style={styles.communityRow}>
          <View style={styles.communityIcon}>
            <Ionicons name="people-outline" size={20} color={colors.accentTeal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.communityTitle}>Community features are coming later.</Text>
            <Text style={styles.communitySub}>
              Your username is saved locally now so ReviveX can support social features later.
            </Text>
          </View>
        </View>
      </AppCard>
    </ScreenContainer>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <AppCard style={styles.statBox}>
      <Ionicons name={icon} size={18} color={colors.accentTeal} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </AppCard>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function isThisWeek(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.24)',
  },
  avatarText: {
    color: colors.accentLime,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  username: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  focusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.accentTeal,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  focusPillText: {
    color: colors.accentTeal,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  targetValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statBox: {
    width: '48%',
    minHeight: 110,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    marginTop: spacing.md,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    flex: 1,
  },
  communityRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  communityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  communityTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  communitySub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
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
