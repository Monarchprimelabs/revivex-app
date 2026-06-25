import React from 'react';
import { Alert, Pressable, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import { exerciseLibraryPreview } from '../../src/data/demoData';
import { useWorkout } from '../../src/context/WorkoutContext';
import {
  formatDurationShort,
  formatRelativeDate,
  formatVolume,
} from '../../src/utils/format';
import type { Routine } from '../../src/types';

/**
 * Train screen
 * Hub for strength training. Now wired to Phase 2's workout logger.
 */
export default function TrainScreen() {
  const {
    history,
    historyLoaded,
    routines,
    routinesLoaded,
    startWorkoutFromRoutine,
  } = useWorkout();

  const handleStartEmpty = () => {
    router.push('/workout/active');
  };

  const handleCreateRoutine = () => {
    router.push('/routine/create');
  };

  const handleOpenRoutine = (routine: Routine) => {
    router.push({ pathname: '/routine/[id]', params: { id: routine.id } });
  };

  const handleStartRoutine = (routine: Routine) => {
    if (routine.exercises.length === 0) {
      Alert.alert(
        'No exercises yet',
        'Add exercises to this routine before starting it.'
      );
      return;
    }

    const started = startWorkoutFromRoutine(routine.id);
    if (!started) {
      Alert.alert('Routine unavailable', 'This routine could not be started.');
      return;
    }

    router.push('/workout/active');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Train</Text>
      <Text style={styles.subtitle}>Lift with intent. Build repeatable strength.</Text>

      <PrimaryButton
        label="Start Empty Workout"
        variant="primary"
        onPress={handleStartEmpty}
        style={{ marginTop: spacing.lg }}
      />

      <SectionHeader title="My Routines" />
      <PrimaryButton
        label="+ Create Routine"
        variant="outline"
        onPress={handleCreateRoutine}
        style={{ marginBottom: spacing.md }}
      />

      {!routinesLoaded ? (
        <AppCard>
          <Text style={styles.placeholder}>Loading routines…</Text>
        </AppCard>
      ) : routines.length === 0 ? (
        <AppCard>
          <Text style={styles.placeholder}>
            Create your first routine to start faster next time.
          </Text>
          <PrimaryButton
            label="Create Routine"
            variant="outline"
            onPress={handleCreateRoutine}
            style={{ marginTop: spacing.md }}
          />
        </AppCard>
      ) : (
        routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            onOpen={() => handleOpenRoutine(routine)}
            onStart={() => handleStartRoutine(routine)}
          />
        ))
      )}

      {/* Recent strength workouts — now wired to history */}
      <SectionHeader title="Recent strength workouts" />
      {!historyLoaded ? (
        <AppCard>
          <Text style={styles.placeholder}>Loading…</Text>
        </AppCard>
      ) : history.length === 0 ? (
        <AppCard>
          <Text style={styles.placeholder}>
            Log your first workout to unlock strength progress.
          </Text>
          <PrimaryButton
            label="Start Workout"
            variant="primary"
            onPress={handleStartEmpty}
            style={{ marginTop: spacing.md }}
          />
        </AppCard>
      ) : (
        history.map((w) => <WorkoutHistoryCard key={w.id} workout={w} />)
      )}

      {/* Exercise library preview */}
      <SectionHeader title="Exercise Library" actionLabel="Browse" />
      <AppCard>
        {exerciseLibraryPreview.map((ex, idx) => (
          <View
            key={ex.id}
            style={[
              styles.libRow,
              idx !== exerciseLibraryPreview.length - 1 && styles.libRowDivider,
            ]}
          >
            <Text style={styles.libName}>{ex.name}</Text>
            <Text style={styles.libGroup}>{ex.muscleGroup}</Text>
          </View>
        ))}
      </AppCard>
    </ScreenContainer>
  );
}

function RoutineCard({
  routine,
  onOpen,
  onStart,
}: {
  routine: Routine;
  onOpen: () => void;
  onStart: () => void;
}) {
  const totalPlannedSets = routine.exercises.reduce(
    (sum, ex) => sum + Math.max(0, ex.targetSets || 0),
    0
  );
  const preview = routine.exercises
    .slice(0, 3)
    .map((exercise) => exercise.exerciseName)
    .join(' • ');

  return (
    <AppCard style={{ marginBottom: spacing.md }}>
      <Pressable onPress={onOpen} hitSlop={6}>
        <View style={styles.routineHeader}>
          <View style={{ flex: 1 }}>
            {routine.goal ? (
              <View style={styles.goalPill}>
                <Text style={styles.goalPillText}>{routine.goal}</Text>
              </View>
            ) : null}
            <Text style={styles.itemTitle}>{routine.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.routineStats}>
          <View style={styles.routineStat}>
            <Ionicons name="barbell-outline" size={14} color={colors.gold} />
            <Text style={styles.routineStatText}>
              {routine.exercises.length} ex
            </Text>
          </View>
          <View style={styles.routineStat}>
            <Ionicons name="layers-outline" size={14} color={colors.tech} />
            <Text style={styles.routineStatText}>
              {totalPlannedSets} sets
            </Text>
          </View>
        </View>

        <Text style={styles.routinePreview}>
          {preview || 'No exercises planned yet'}
        </Text>
      </Pressable>

      <PrimaryButton
        label="Start Routine"
        variant="primary"
        onPress={onStart}
        style={{ marginTop: spacing.md }}
      />
    </AppCard>
  );
}

function WorkoutHistoryCard({ workout }: { workout: import('../../src/types').Workout }) {
  const dateLabel = formatRelativeDate(workout.date);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={{ marginBottom: spacing.md }}
    >
      <AppCard>
        <View style={styles.histHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{workout.title}</Text>
            <Text style={styles.histDate}>{dateLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>

        <View style={styles.histStatsRow}>
          <View style={styles.histStat}>
            <Ionicons name="barbell-outline" size={14} color={colors.gold} />
            <Text style={styles.histStatText}>
              {workout.exercises.length} ex
            </Text>
          </View>
          <View style={styles.histStat}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.histStatText}>
              {workout.totalSets} sets
            </Text>
          </View>
          <View style={styles.histStat}>
            <Ionicons name="trending-up-outline" size={14} color={colors.tech} />
            <Text style={styles.histStatText}>
              {formatVolume(workout.totalVolume)}
            </Text>
          </View>
          <View style={styles.histStat}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.histStatText}>
              {formatDurationShort(workout.duration)}
            </Text>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  itemTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  itemSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  goalPill: {
    alignSelf: 'flex-start',
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: glow.goldStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  goalPillText: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  routineStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  routineStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  routineStatText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
  routinePreview: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  libRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  libRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  libName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  libGroup: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  histHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  histDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  histStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  histStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  histStatText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
  },
});
