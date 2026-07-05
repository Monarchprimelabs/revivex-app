import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AppCard from '../../../src/components/AppCard';
import PrimaryButton from '../../../src/components/PrimaryButton';
import { useWorkout } from '../../../src/context/WorkoutContext';
import { exerciseLibrary } from '../../../src/data/exerciseLibrary';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/theme/theme';
import type { Exercise, MuscleGroup, WorkoutExercise } from '../../../src/types';

interface SetDraft {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  notes?: string;
}

interface ExerciseDraft {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: SetDraft[];
}

let _draftCounter = 0;
function makeDraftId(prefix: string) {
  _draftCounter += 1;
  return `${prefix}_edit_${Date.now()}_${_draftCounter}`;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function dateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeDateInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseWeight(value: string): number {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseReps(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function numberInputValue(value: number): string {
  return Number.isFinite(value) && value > 0 ? String(value) : '';
}

function draftsFromExercises(exercises: WorkoutExercise[]): ExerciseDraft[] {
  return exercises.map((exercise) => ({
    id: exercise.id || makeDraftId('we'),
    exerciseId: exercise.exerciseId,
    exerciseName: exercise.exerciseName,
    muscleGroup: exercise.muscleGroup,
    sets: exercise.sets.map((set) => ({
      id: set.id || makeDraftId('set'),
      weight: numberInputValue(set.weight),
      reps: numberInputValue(set.reps),
      completed: set.completed ?? false,
      notes: set.notes,
    })),
  }));
}

export default function EditWorkoutScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const workoutId = firstParam(params.id);
  const { getWorkoutById, updateWorkoutDetails } = useWorkout();
  const workout = workoutId ? getWorkoutById(workoutId) : undefined;

  const [title, setTitle] = useState(workout?.title ?? '');
  const [date, setDate] = useState(workout ? dateInputValue(workout.date) : '');
  const [notes, setNotes] = useState(workout?.notes ?? '');
  const [exercises, setExercises] = useState<ExerciseDraft[]>(() =>
    workout ? draftsFromExercises(workout.exercises) : []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        totalSets += 1;
        if (set.completed) {
          completedSets += 1;
          totalVolume += parseWeight(set.weight) * parseReps(set.reps);
        }
      }
    }
    return { totalSets, completedSets, totalVolume };
  }, [exercises]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return exerciseLibrary
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(q) ||
          exercise.muscleGroup.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query]);

  const isDirty = useMemo(() => {
    if (!workout) return false;
    return (
      title !== workout.title ||
      date !== dateInputValue(workout.date) ||
      notes !== (workout.notes ?? '') ||
      JSON.stringify(exercises) !== JSON.stringify(draftsFromExercises(workout.exercises))
    );
  }, [date, exercises, notes, title, workout]);

  const updateSet = (exerciseId: string, setId: string, patch: Partial<SetDraft>) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
        };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const last = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: makeDraftId('set'),
              weight: last?.weight ?? '',
              reps: last?.reps ?? '',
              completed: true,
            },
          ],
        };
      })
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        if (exercise.sets.length <= 1) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== setId),
        };
      })
    );
  };

  const removeExercise = (exerciseId: string) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    Alert.alert(
      'Remove exercise?',
      `${exercise.exerciseName} and its sets will be removed from this workout.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            setExercises((current) => current.filter((item) => item.id !== exerciseId)),
        },
      ]
    );
  };

  const addExercise = (exercise: Exercise) => {
    setExercises((current) => [
      ...current,
      {
        id: makeDraftId('we'),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        sets: [
          {
            id: makeDraftId('set'),
            weight: '',
            reps: '',
            completed: true,
          },
        ],
      },
    ]);
    setQuery('');
    setPickerOpen(false);
  };

  const handleCancel = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Discard changes?', 'Your edits to this workout will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleSave = () => {
    if (!workoutId || !workout) return;

    const trimmedTitle = title.trim();
    const normalizedDate = normalizeDateInput(date);

    if (!trimmedTitle) {
      Alert.alert('Title required', 'Give this workout a title before saving.');
      return;
    }

    if (!normalizedDate) {
      Alert.alert('Date needed', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert(
        'Exercise needed',
        'Keep at least one exercise, or delete the workout from its detail screen instead.'
      );
      return;
    }

    const updatedExercises: WorkoutExercise[] = exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      muscleGroup: exercise.muscleGroup,
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        setNumber: index + 1,
        weight: parseWeight(set.weight),
        reps: parseReps(set.reps),
        completed: set.completed,
        notes: set.notes,
      })),
    }));

    updateWorkoutDetails(workoutId, {
      title: trimmedTitle,
      date: normalizedDate,
      notes,
      exercises: updatedExercises,
    });

    router.replace({ pathname: '/workout/[id]', params: { id: workoutId } });
  };

  if (!workoutId || !workout) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.missingWrap}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={styles.missingTitle}>Workout not found</Text>
          <Text style={styles.emptyText}>
            This workout may have been deleted or is no longer available.
          </Text>
          <PrimaryButton
            label="Back to Train"
            variant="outline"
            onPress={() => router.replace('/train')}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Edit Workout</Text>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard elevated tint="strength">
            <Text style={styles.label}>Workout title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              placeholder="Strength Workout"
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.notesInput]}
              placeholder="Workout notes optional"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
          </AppCard>

          <View style={styles.summaryCard}>
            <SummaryMetric label="Sets" value={String(totals.totalSets)} />
            <SummaryMetric label="Done" value={String(totals.completedSets)} />
            <SummaryMetric
              label="Volume"
              value={`${Math.round(totals.totalVolume).toLocaleString()}`}
            />
          </View>

          <Text style={styles.sectionHeader}>Exercises</Text>

          {exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseMuscle}>{exercise.muscleGroup}</Text>
                </View>
                <Pressable
                  onPress={() => removeExercise(exercise.id)}
                  hitSlop={8}
                  style={styles.removeExerciseBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderText, styles.setNumCol]}>Set</Text>
                <Text style={[styles.setHeaderText, styles.setInputCol]}>Weight</Text>
                <Text style={[styles.setHeaderText, styles.setInputCol]}>Reps</Text>
                <Text style={[styles.setHeaderText, styles.setDoneCol]}>Done</Text>
                <View style={styles.setRemoveCol} />
              </View>

              {exercise.sets.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setNumber, styles.setNumCol]}>{index + 1}</Text>
                  <TextInput
                    value={set.weight}
                    onChangeText={(weight) => updateSet(exercise.id, set.id, { weight })}
                    style={[styles.setInput, styles.setInputCol]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={7}
                  />
                  <TextInput
                    value={set.reps}
                    onChangeText={(reps) => updateSet(exercise.id, set.id, { reps })}
                    style={[styles.setInput, styles.setInputCol]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  <Pressable
                    onPress={() =>
                      updateSet(exercise.id, set.id, { completed: !set.completed })
                    }
                    hitSlop={8}
                    style={[styles.setDoneCol, styles.doneToggle]}
                  >
                    <Ionicons
                      name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={set.completed ? colors.accentLime : colors.textMuted}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => removeSet(exercise.id, set.id)}
                    hitSlop={8}
                    style={[styles.setRemoveCol, styles.removeSetBtn]}
                    disabled={exercise.sets.length <= 1}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={exercise.sets.length <= 1 ? colors.border : colors.textMuted}
                    />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addSet(exercise.id)} style={styles.addSetBtn}>
                <Ionicons name="add" size={18} color={colors.accentTeal} />
                <Text style={styles.addSetText}>Add Set</Text>
              </Pressable>
            </View>
          ))}

          {pickerOpen ? (
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Add Exercise</Text>
                <Pressable
                  onPress={() => {
                    setPickerOpen(false);
                    setQuery('');
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                  placeholder="Search exercises or muscle group"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {query.trim().length === 0 ? (
                <Text style={styles.pickerHint}>Type to search the exercise library.</Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.pickerHint}>No matches. Try a different term.</Text>
              ) : (
                searchResults.map((exercise, index) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => addExercise(exercise)}
                    style={[
                      styles.pickerRow,
                      index !== searchResults.length - 1 && styles.pickerRowDivider,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerRowName}>{exercise.name}</Text>
                      <Text style={styles.pickerRowMuscle}>{exercise.muscleGroup}</Text>
                    </View>
                    <Ionicons name="add-circle" size={22} color={colors.accentTeal} />
                  </Pressable>
                ))
              )}
            </View>
          ) : (
            <PrimaryButton
              label="+ Add Exercise"
              variant="outline"
              onPress={() => setPickerOpen(true)}
              style={{ marginTop: spacing.xs }}
            />
          )}

          <PrimaryButton
            label="Save Workout"
            variant="primary"
            onPress={handleSave}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
    width: 64,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  saveBtn: {
    width: 64,
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  saveBtnText: {
    color: colors.gold,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  titleInput: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    padding: 0,
  },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
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
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  exerciseMuscle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  removeExerciseBtn: {
    padding: spacing.xs,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  setHeaderText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  setNumCol: {
    width: 28,
    textAlign: 'center',
  },
  setInputCol: {
    flex: 1,
  },
  setDoneCol: {
    width: 44,
    alignItems: 'center',
  },
  setRemoveCol: {
    width: 28,
    alignItems: 'center',
  },
  setNumber: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  setInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  doneToggle: {
    justifyContent: 'center',
  },
  removeSetBtn: {
    justifyContent: 'center',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
  },
  addSetText: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: 0,
  },
  pickerHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pickerRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  pickerRowName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  pickerRowMuscle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
