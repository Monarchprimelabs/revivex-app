import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import StatCard from '../../src/components/StatCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import BrandTagline from '../../src/components/BrandTagline';
import ActivityFeedCard from '../../src/components/ActivityFeedCard';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';
import { useWorkout } from '../../src/context/WorkoutContext';
import { useRuns } from '../../src/context/RunContext';
import { useHybridSessions } from '../../src/context/HybridContext';
import { useProfile } from '../../src/context/ProfileContext';
import { getRunsThisWeek } from '../../src/utils/runStats';
import { getWorkoutsThisWeek } from '../../src/utils/progress';
import { getRecentActivity } from '../../src/utils/activityFeed';

/**
 * Home screen
 * The dashboard the user lands on. Uses local saved workouts, runs, and hybrid sessions.
 */
export default function HomeScreen() {
  const startWorkout = () => router.push('/workout/active');
  const logRun = () => router.push('/run/log');
  const startHybrid = () => router.push('/hybrid/start');
  const { history } = useWorkout();
  const { runs } = useRuns();
  const { hybridSessions } = useHybridSessions();
  const { profile } = useProfile();

  const recentActivities = useMemo(
    () => getRecentActivity(history, runs, hybridSessions, 4),
    [history, runs, hybridSessions]
  );

  const weeklySessions =
    getWorkoutsThisWeek(history) +
    getRunsThisWeek(runs) +
    hybridSessions.filter((session) => isThisWeek(session.date)).length;
  const totalLoggedSessions = history.length + runs.length + hybridSessions.length;
  const weeklyTarget = profile?.weeklyTrainingTarget ?? 4;
  const weeklyProgress = `${Math.min(weeklySessions, weeklyTarget)} / ${weeklyTarget}`;
  const focusCopy = getFocusCopy(profile?.trainingFocus);

  return (
    <ScreenContainer>
      {/* Welcome */}
      <View style={styles.topRow}>
        <View style={styles.brandBlock}>
          <View style={styles.brandRail} />
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>Revive</Text>
              <Text style={styles.brandX}>X</Text>
            </View>
            <BrandTagline style={styles.tagline} />
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          hitSlop={8}
          style={styles.profileButton}
        >
          <Ionicons name="person-outline" size={20} color={colors.accentTeal} />
        </Pressable>
      </View>
      {profile ? <Text style={styles.welcome}>Welcome back, {profile.displayName}</Text> : null}
      <Text style={styles.mission}>
        Track lifting, running, conditioning, and progress in one focused training hub.
      </Text>

      {/* Today's training */}
      <AppCard elevated tint="strength" style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>
          {profile ? `${profile.trainingFocus} focus` : "Today's training"}
        </Text>
        <Text style={styles.cardTitle}>{focusCopy.title}</Text>
        <Text style={styles.cardSub}>{focusCopy.subtitle}</Text>
        <PrimaryButton
          label="Start Workout"
          variant="primary"
          onPress={startWorkout}
          style={{ marginTop: spacing.md }}
        />
      </AppCard>

      {/* Streak row */}
      <View style={styles.row}>
        <StatCard
          label="Weekly Target"
          value={weeklyProgress}
          hint="sessions this week"
          accent="accentWarm"
        />
        <View style={{ width: spacing.md }} />
        <StatCard
          label="Total Sessions"
          value={String(totalLoggedSessions)}
          hint="all time"
          accent="accent"
        />
      </View>

      {/* Quick actions */}
      <SectionHeader title="Quick actions" />
      <View style={styles.quickGrid}>
        <PrimaryButton
          label="Start Workout"
          variant="primary"
          onPress={startWorkout}
          style={styles.quickBtn}
        />
        <PrimaryButton
          label="Log Run"
          variant="outline"
          onPress={logRun}
          style={styles.quickBtn}
        />
        <PrimaryButton
          label="Start Hybrid Session"
          variant="accent"
          onPress={startHybrid}
          style={styles.quickBtn}
        />
      </View>

      {/* Recent activity */}
      <SectionHeader
        title="Recent activity"
        actionLabel={recentActivities.length > 0 ? 'See all' : undefined}
        onActionPress={() => router.push('/activity')}
      />
      {recentActivities.length === 0 ? (
        <AppCard>
          <Text style={styles.placeholder}>
            Start with a workout, run, or hybrid session. Your recent work will show here.
          </Text>
          <PrimaryButton
            label="Open Activity Feed"
            variant="outline"
            onPress={() => router.push('/activity')}
            style={{ marginTop: spacing.md }}
          />
        </AppCard>
      ) : (
        recentActivities.map((item) => (
          <ActivityFeedCard
            key={item.id}
            item={item}
            compact
            onPress={() => router.push(item.route)}
          />
        ))
      )}
    </ScreenContainer>
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

function getFocusCopy(trainingFocus?: string) {
  if (trainingFocus === 'Lift') {
    return {
      title: 'Ready to build strength today?',
      subtitle: 'Open the logger and stack quality work.',
    };
  }

  if (trainingFocus === 'Run') {
    return {
      title: 'Ready to build your engine?',
      subtitle: 'Log miles, pace, and aerobic progress.',
    };
  }

  if (trainingFocus === 'Hybrid') {
    return {
      title: 'Ready to train hybrid?',
      subtitle: 'Blend lifting, running, and conditioning.',
    };
  }

  return {
    title: 'Ready to move today?',
    subtitle: 'Lift, run, condition, recover.',
  };
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandRail: {
    width: 4,
    height: 54,
    borderRadius: 2,
    backgroundColor: colors.accentLime,
    marginRight: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0,
    fontStyle: 'italic',
  },
  brandX: {
    color: colors.accentLime,
    fontSize: fontSize.display + 4,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0,
    fontStyle: 'italic',
    transform: [{ skewX: '-8deg' }],
  },
  tagline: {
    marginTop: spacing.xs,
  },
  mission: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  welcome: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  row: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  quickGrid: {
    gap: spacing.md,
  },
  quickBtn: {
    width: '100%',
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
