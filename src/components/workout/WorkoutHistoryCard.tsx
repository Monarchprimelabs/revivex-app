import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppCard from '../AppCard';
import { colors, fontSize, fontWeight, spacing } from '../../theme/theme';
import {
  formatDurationShort,
  formatRelativeDate,
  formatVolume,
} from '../../utils/format';
import type { Workout } from '../../types';

/**
 * WorkoutHistoryCard
 * Summary card for a completed strength workout. Used on the Train tab
 * and the full Workout History screen; tapping opens Workout Detail.
 */
export default function WorkoutHistoryCard({ workout }: { workout: Workout }) {
  const dateLabel = formatRelativeDate(workout.date);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{workout.title}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="barbell-outline" size={14} color={colors.gold} />
            <Text style={styles.statText}>{workout.exercises.length} ex</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{workout.totalSets} sets</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="trending-up-outline" size={14} color={colors.tech} />
            <Text style={styles.statText}>{formatVolume(workout.totalVolume)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{formatDurationShort(workout.duration)}</Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  date: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
