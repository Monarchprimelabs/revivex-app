import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import ActivityFeedCard from '../../src/components/ActivityFeedCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useActivityFeed } from '../../src/context/ActivityFeedContext';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';

export default function ActivityFeedScreen() {
  const { activityFeed, activityFeedLoaded } = useActivityFeed();

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Your recent training history.</Text>
        </View>
      </View>

      {!activityFeedLoaded ? (
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyText}>Loading activity...</Text>
        </AppCard>
      ) : activityFeed.length === 0 ? (
        <AppCard elevated tint="hybrid" style={{ marginTop: spacing.lg }}>
          <View style={styles.emptyIcon}>
            <Ionicons name="pulse-outline" size={28} color={colors.accentTeal} />
          </View>
          <Text style={styles.emptyTitle}>Your timeline starts with training.</Text>
          <Text style={styles.emptyText}>
            Your activity feed will come alive as you log workouts, runs, and hybrid sessions.
          </Text>
          <View style={styles.emptyActions}>
            <PrimaryButton
              label="Start Workout"
              variant="primary"
              onPress={() => router.push('/workout/active')}
            />
            <PrimaryButton
              label="Log Run"
              variant="tech"
              onPress={() => router.push('/run/log')}
            />
            <PrimaryButton
              label="Start Hybrid Session"
              variant="outline"
              onPress={() => router.push('/hybrid/start')}
            />
          </View>
        </AppCard>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          {activityFeed.map((item) => (
            <ActivityFeedCard
              key={item.id}
              item={item}
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
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
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 179, 0.24)',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  emptyActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
