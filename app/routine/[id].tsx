import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useWorkout } from '../../src/context/WorkoutContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import type { Routine, RoutineExercise } from '../../src/types';

function formatRest(seconds?: number): string | null {
  if (seconds === undefined || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s rest`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s rest` : `${minutes}m rest`;
}

function formatTarget(exercise: RoutineExercise): string {
  const reps = exercise.targetReps === undefined ? 'reps open' : `${exercise.targetReps} reps`;
  const weight =
    exercise.targetWeight === undefined ? null : `${exercise.targetWeight} kg`;
  return [reps, weight, formatRest(exercise.restSeconds)].filter(Boolean).join(' • ');
}

export default function RoutineDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const routineId = typeof params.id === 'string' ? params.id : undefined;
  const { getRoutineById, deleteRoutine, startWorkoutFromRoutine } = useWorkout();
  const routine = routineId ? getRoutineById(routineId) : undefined;

  const handleStart = () => {
    if (!routineId || !routine) {
      Alert.alert('Routine unavailable', 'This routine could not be found.');
      return;
    }

    if (routine.exercises.length === 0) {
      Alert.alert(
        'No exercises yet',
        'Add exercises to this routine before starting it.'
      );
      return;
    }

    const started = startWorkoutFromRoutine(routineId);
    if (!started) {
      Alert.alert('Routine unavailable', 'This routine could not be started.');
      return;
    }

    router.push('/workout/active');
  };

  const handleDelete = () => {
    if (!routineId || !routine) return;

    Alert.alert(
      'Delete Routine?',
      'This routine will be permanently removed from your local saved routines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRoutine(routineId);
            router.replace('/train');
          },
        },
      ]
    );
  };

  if (!routineId || !routine) {
    return <MissingRoutineScreen />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Routine</Text>
        <Pressable onPress={handleDelete} hitSlop={8} style={styles.topBarBtnRight}>
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <RoutineHero routine={routine} />

        <PrimaryButton
          label="Start Routine"
          variant="primary"
          onPress={handleStart}
          style={{ marginTop: spacing.lg }}
        />

        <Text style={styles.editNote}>Editing routines will come in a later phase.</Text>

        <Text style={styles.sectionTitle}>Exercises</Text>
        {routine.exercises.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyText}>
              This routine has no exercises yet. Create a new routine with exercises to start
              from a plan.
            </Text>
          </AppCard>
        ) : (
          routine.exercises.map((exercise, index) => (
            <RoutineExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
            />
          ))
        )}

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Routine</Text>
        </Pressable>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MissingRoutineScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Routine</Text>
        <View style={styles.topBarBtnRight} />
      </View>
      <View style={styles.missingWrap}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
        <Text style={styles.missingTitle}>Routine not found</Text>
        <Text style={styles.emptyText}>
          It may have been deleted, or the link may be missing a routine ID.
        </Text>
        <PrimaryButton
          label="Back to Train"
          variant="primary"
          onPress={() => router.replace('/train')}
          style={{ marginTop: spacing.lg, width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

function RoutineHero({ routine }: { routine: Routine }) {
  const totalSets = routine.exercises.reduce(
    (sum, exercise) => sum + Math.max(0, exercise.targetSets || 0),
    0
  );

  return (
    <AppCard elevated tint={routine.goal === 'Hybrid' ? 'hybrid' : 'strength'}>
      {routine.goal ? (
        <View style={styles.goalPill}>
          <Text style={styles.goalPillText}>{routine.goal}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{routine.name}</Text>
      {routine.description ? (
        <Text style={styles.description}>{routine.description}</Text>
      ) : null}

      <View style={styles.statRow}>
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{routine.exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={[styles.statValue, { color: colors.gold }]}>{totalSets}</Text>
          <Text style={styles.statLabel}>Planned sets</Text>
        </View>
      </View>
    </AppCard>
  );
}

function RoutineExerciseCard({
  exercise,
  index,
}: {
  exercise: RoutineExercise;
  index: number;
}) {
  return (
    <AppCard style={{ marginBottom: spacing.md }}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseIndex}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseGroup}>{exercise.muscleGroup}</Text>
        </View>
      </View>

      <View style={styles.exerciseStats}>
        <View style={styles.exerciseStat}>
          <Text style={styles.exerciseStatValue}>{exercise.targetSets}</Text>
          <Text style={styles.exerciseStatLabel}>Sets</Text>
        </View>
        <View style={styles.exerciseStatWide}>
          <Text style={styles.exerciseMeta}>{formatTarget(exercise)}</Text>
        </View>
      </View>
    </AppCard>
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
    width: 64,
  },
  topBarBtnRight: {
    width: 64,
    alignItems: 'flex-end',
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
  goalPill: {
    alignSelf: 'flex-start',
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: glow.goldStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  goalPillText: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  editNote: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: glow.goldStrong,
  },
  exerciseIndexText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  exerciseGroup: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  exerciseStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  exerciseStat: {
    minWidth: 70,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  exerciseStatWide: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseStatValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  exerciseStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
});
