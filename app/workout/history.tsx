import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import WorkoutHistoryCard from '../../src/components/workout/WorkoutHistoryCard';
import { useWorkout } from '../../src/context/WorkoutContext';
import { colors, fontSize, fontWeight, spacing } from '../../src/theme/theme';

/**
 * Workout History
 * Full list of completed strength workouts (the Train tab shows only the
 * most recent few). Tapping a card opens Workout Detail.
 */
export default function WorkoutHistoryScreen() {
  const { history, historyLoaded } = useWorkout();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Workout History</Text>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {!historyLoaded ? (
          <Text style={styles.placeholder}>Loading…</Text>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySub}>
              Finish a workout and it will show up here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countLine}>
              {history.length} workout{history.length === 1 ? '' : 's'} logged
            </Text>
            {history.map((workout) => (
              <WorkoutHistoryCard key={workout.id} workout={workout} />
            ))}
          </>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
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
  },
  countLine: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  placeholder: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
