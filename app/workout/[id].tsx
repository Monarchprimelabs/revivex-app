import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import HealthMetricsCard from '../../src/components/HealthMetricsCard';
import ExerciseThumb from '../../src/components/ExerciseThumb';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useProfile } from '../../src/context/ProfileContext';
import { useWorkout } from '../../src/context/WorkoutContext';
import { celebratePR } from '../../src/utils/haptics';
import {
  formatEst1RM,
  formatPRWeight,
  getPRHistory,
} from '../../src/utils/prHistory';
import { workoutToRoutineInput } from '../../src/utils/workoutToRoutine';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import {
  formatDuration,
  formatFullDate,
  formatRelativeDate,
  formatVolume,
} from '../../src/utils/format';
import type { WorkoutExercise } from '../../src/types';

export default function WorkoutDetailScreen() {
  const { id, celebrate } = useLocalSearchParams<{ id?: string; celebrate?: string }>();
  const { deleteWorkout, getWorkoutById, repeatWorkout, createRoutine, history } = useWorkout();
  const { profile } = useProfile();
  const weightUnit = profile?.preferredWeightUnit ?? 'lb';
  const workout = id ? getWorkoutById(id) : undefined;

  // Records set in THIS workout (first-time lifts count, like the big apps).
  const prEvents = useMemo(
    () => (id ? getPRHistory(history).events.filter((event) => event.workoutId === id) : []),
    [history, id]
  );

  const handleRepeat = () => {
    if (!id || !workout) return;

    const started = repeatWorkout(id);
    if (!started) {
      Alert.alert('Workout unavailable', 'This workout could not be repeated.');
      return;
    }

    router.push('/workout/active');
  };

  const handleDelete = () => {
    if (!workout) return;

    Alert.alert(
      'Delete Workout?',
      'This workout will be permanently removed from your local history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(workout.id);
            router.replace('/train');
          },
        },
      ]
    );
  };

  const openShareCard = () => {
    if (!workout) return;
    router.push({
      pathname: '/share/[type]/[id]',
      params: { type: 'workout', id: workout.id },
    });
  };

  const openEditWorkout = () => {
    if (!workout) return;
    router.push({ pathname: '/workout/edit/[id]', params: { id: workout.id } });
  };

  const handleSaveAsRoutine = () => {
    if (!workout) return;

    const input = workoutToRoutineInput(workout);
    if (input.exercises.length === 0) {
      Alert.alert(
        'Nothing to save',
        'This workout has no exercises with sets, so a routine can’t be created from it.'
      );
      return;
    }

    Alert.alert(
      'Save as routine?',
      `Creates "${input.name}" with ${input.exercises.length} exercise${
        input.exercises.length === 1 ? '' : 's'
      }, using each exercise’s set count, most common reps, and top weight as targets.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Routine',
          onPress: () => {
            const routine = createRoutine(input);
            router.push({ pathname: '/routine/[id]', params: { id: routine.id } });
          },
        },
      ]
    );
  };

  if (!id || !workout) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <AppCard style={{ marginTop: spacing.lg }}>
          <Text style={styles.emptyTitle}>Workout not found</Text>
          <Text style={styles.emptyText}>
            This workout may have been deleted or is no longer available.
          </Text>
          <PrimaryButton
            label="Back to Train"
            variant="outline"
            onPress={() => router.replace('/train')}
            style={{ marginTop: spacing.lg }}
          />
        </AppCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>

      <AppCard elevated tint="strength" style={{ marginTop: spacing.md }}>
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>Strength</Text>
        </View>
        <Text style={styles.title}>{workout.title}</Text>
        <Text style={styles.subtitle}>{formatRelativeDate(workout.date)}</Text>

        <View style={styles.heroGrid}>
          <Metric label="Exercises" value={String(workout.exercises.length)} />
          <Metric label="Sets" value={String(workout.totalSets)} />
          <Metric label="Duration" value={formatDuration(workout.duration)} />
        </View>
      </AppCard>

      {prEvents.length > 0 ? (
        <PRBanner
          events={prEvents}
          weightUnit={weightUnit}
          animateIn={celebrate === '1'}
        />
      ) : null}

      <HealthMetricsCard dateIso={workout.date} durationSeconds={workout.duration} />

      <AppCard style={{ marginTop: spacing.md }}>
        <DetailRow label="Date" value={formatFullDate(workout.date)} />
        <DetailRow label="Volume" value={formatVolume(workout.totalVolume)} />
        {workout.notes ? <DetailRow label="Notes" value={workout.notes} multiline /> : null}
      </AppCard>

      <Text style={styles.sectionTitle}>Exercises</Text>
      {workout.exercises.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyText}>No exercises were saved with this workout.</Text>
        </AppCard>
      ) : (
        workout.exercises.map((exercise, index) => (
          <WorkoutExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
          />
        ))
      )}

      <PrimaryButton
        label="Repeat Workout"
        variant="primary"
        onPress={handleRepeat}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="Save as Routine"
        variant="outline"
        onPress={handleSaveAsRoutine}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="Edit Workout"
        variant="outline"
        onPress={openEditWorkout}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="View Share Card"
        variant="tech"
        onPress={openShareCard}
        style={{ marginTop: spacing.md }}
      />

      <PrimaryButton
        label="Delete Workout"
        variant="outline"
        onPress={handleDelete}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

function PRBanner({
  events,
  weightUnit,
  animateIn,
}: {
  events: ReturnType<typeof getPRHistory>['events'];
  weightUnit: string;
  animateIn: boolean;
}) {
  const scale = useRef(new Animated.Value(animateIn ? 0.6 : 1)).current;
  const opacity = useRef(new Animated.Value(animateIn ? 0 : 1)).current;
  const fired = useRef(false);

  useEffect(() => {
    if (!animateIn || fired.current) return;
    fired.current = true;
    celebratePR();
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [animateIn, opacity, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <View style={styles.prCard}>
        <View style={styles.prHeader}>
          <Ionicons name="trophy" size={20} color={colors.gold} />
          <Text style={styles.prTitle}>
            {events.length === 1 ? 'New Record!' : `${events.length} New Records!`}
          </Text>
        </View>
        {events.map((event) => (
          <View key={`${event.exerciseId}-${event.kind}-${event.date}`} style={styles.prRow}>
            <Text style={styles.prExercise} numberOfLines={1}>
              {event.exerciseName}
            </Text>
            <Text style={styles.prValue}>
              {event.kind === 'weight'
                ? `${formatPRWeight(event.weight, weightUnit)} × ${event.reps}`
                : `${formatEst1RM(event.est1RM, weightUnit)} e1RM`}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
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

function WorkoutExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const completedSets = exercise.sets.filter((set) => set.completed).length;

  return (
    <AppCard style={{ marginBottom: spacing.md }}>
      <View style={styles.exerciseHeader}>
        <ExerciseThumb
          name={exercise.exerciseName}
          muscleGroup={exercise.muscleGroup}
          exerciseId={exercise.exerciseId}
          size={40}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseGroup}>
            #{index + 1} • {exercise.muscleGroup}
          </Text>
        </View>
      </View>

      <View style={styles.setSummaryRow}>
        <Text style={styles.setSummary}>
          {exercise.sets.length} sets • {completedSets} completed
        </Text>
      </View>

      {exercise.sets.map((set, setIndex) => (
        <View
          key={set.id}
          style={[
            styles.setRow,
            setIndex !== exercise.sets.length - 1 && styles.rowDivider,
          ]}
        >
          <Text style={styles.setNumber}>Set {set.setNumber}</Text>
          <Text style={styles.setResult}>
            {set.weight} kg x {set.reps}
          </Text>
        </View>
      ))}
    </AppCard>
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
  prCard: {
    marginTop: spacing.md,
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: glow.goldStrong,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  prTitle: {
    color: colors.gold,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  prExercise: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flexShrink: 1,
  },
  prValue: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
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
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.22)',
  },
  exerciseIndexText: {
    color: colors.accentLime,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
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
  setSummaryRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.md,
  },
  setSummary: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  setNumber: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  setResult: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
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
