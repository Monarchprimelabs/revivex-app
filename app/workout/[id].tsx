import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useWorkout } from '../../src/context/WorkoutContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import {
  formatDuration,
  formatFullDate,
  formatRelativeDate,
  formatVolume,
} from '../../src/utils/format';
import type { WorkoutExercise } from '../../src/types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { deleteWorkout, getWorkoutById, repeatWorkout } = useWorkout();
  const workout = id ? getWorkoutById(id) : undefined;

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
        <View style={styles.exerciseIndex}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseGroup}>{exercise.muscleGroup}</Text>
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
