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
import { router } from 'expo-router';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { exerciseLibrary } from '../../src/data/exerciseLibrary';
import { useWorkout } from '../../src/context/WorkoutContext';
import { colors, fontSize, fontWeight, glow, radius, spacing } from '../../src/theme/theme';
import type { Exercise, RoutineExercise, RoutineGoal } from '../../src/types';

const routineGoals: RoutineGoal[] = [
  'Strength',
  'Bodybuilding',
  'Hybrid',
  'Running Support',
  'General Fitness',
];

function makeDraftExercise(exercise: Exercise, index: number): RoutineExercise {
  return {
    id: `rtex_${exercise.id}_${Date.now()}_${index}`,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    targetSets: 3,
    targetReps: 10,
    restSeconds: 90,
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalInteger(value: string): number | undefined {
  const parsed = parseOptionalNumber(value);
  return parsed === undefined ? undefined : Math.floor(parsed);
}

function numberInputValue(value?: number): string {
  return value === undefined ? '' : String(value);
}

export default function CreateRoutineScreen() {
  const { createRoutine } = useWorkout();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<RoutineGoal | undefined>('Strength');
  const [query, setQuery] = useState('');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exerciseLibrary;
    return exerciseLibrary.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(q) ||
        exercise.muscleGroup.toLowerCase().includes(q)
    );
  }, [query]);

  const totalPlannedSets = routineExercises.reduce(
    (sum, exercise) => sum + Math.max(0, exercise.targetSets || 0),
    0
  );

  const addExercise = (exercise: Exercise) => {
    setRoutineExercises((prev) => [
      ...prev,
      makeDraftExercise(exercise, prev.length + 1),
    ]);
  };

  const updateExercise = (
    routineExerciseId: string,
    patch: Partial<Pick<RoutineExercise, 'targetSets' | 'targetReps' | 'targetWeight' | 'restSeconds'>>
  ) => {
    setRoutineExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === routineExerciseId ? { ...exercise, ...patch } : exercise
      )
    );
  };

  const removeExercise = (routineExerciseId: string) => {
    setRoutineExercises((prev) =>
      prev.filter((exercise) => exercise.id !== routineExerciseId)
    );
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Give this routine a name before saving.');
      return;
    }

    const invalidExercise = routineExercises.find(
      (exercise) => !Number.isFinite(exercise.targetSets) || exercise.targetSets < 1
    );
    if (invalidExercise) {
      Alert.alert(
        'Check target sets',
        `${invalidExercise.exerciseName} needs at least 1 planned set.`
      );
      return;
    }

    const routine = createRoutine({
      name: trimmedName,
      description,
      goal,
      exercises: routineExercises,
    });

    router.replace({ pathname: '/routine/[id]', params: { id: routine.id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Create Routine</Text>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard elevated tint="strength" style={{ marginBottom: spacing.lg }}>
            <Text style={styles.label}>Routine name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.nameInput}
              placeholder="Push strength"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.descriptionInput}
              placeholder="Optional notes, intent, or cues"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={240}
            />
          </AppCard>

          <Text style={styles.sectionTitle}>Goal</Text>
          <View style={styles.goalWrap}>
            {routineGoals.map((item) => {
              const selected = item === goal;
              return (
                <Pressable
                  key={item}
                  onPress={() => setGoal(selected ? undefined : item)}
                  style={[styles.goalChip, selected && styles.goalChipActive]}
                >
                  <Text style={[styles.goalChipText, selected && styles.goalChipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{routineExercises.length}</Text>
              <Text style={styles.summaryLabel}>Exercises</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={[styles.summaryValue, { color: colors.gold }]}>
                {totalPlannedSets}
              </Text>
              <Text style={styles.summaryLabel}>Planned sets</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Routine exercises</Text>
          {routineExercises.length === 0 ? (
            <AppCard style={{ marginBottom: spacing.lg }}>
              <Text style={styles.emptyText}>
                No exercises yet. Add from the library below.
              </Text>
            </AppCard>
          ) : (
            routineExercises.map((exercise) => (
              <RoutineExerciseEditor
                key={exercise.id}
                exercise={exercise}
                onUpdate={(patch) => updateExercise(exercise.id, patch)}
                onRemove={() => removeExercise(exercise.id)}
              />
            ))
          )}

          <Text style={styles.sectionTitle}>Add exercise</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search exercises or muscle group"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <AppCard>
            {filteredExercises.length === 0 ? (
              <Text style={styles.emptyText}>No matching exercises.</Text>
            ) : (
              filteredExercises.map((exercise, index) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => addExercise(exercise)}
                  style={[
                    styles.libraryRow,
                    index !== filteredExercises.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libraryName}>{exercise.name}</Text>
                    <Text style={styles.libraryGroup}>{exercise.muscleGroup}</Text>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.gold} />
                </Pressable>
              ))
            )}
          </AppCard>

          <PrimaryButton
            label="Save Routine"
            variant="primary"
            onPress={handleSave}
            style={{ marginTop: spacing.lg }}
          />

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoutineExerciseEditor({
  exercise,
  onUpdate,
  onRemove,
}: {
  exercise: RoutineExercise;
  onUpdate: (
    patch: Partial<Pick<RoutineExercise, 'targetSets' | 'targetReps' | 'targetWeight' | 'restSeconds'>>
  ) => void;
  onRemove: () => void;
}) {
  return (
    <AppCard style={{ marginBottom: spacing.md }}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseGroup}>{exercise.muscleGroup}</Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.inputGrid}>
        <PlannedInput
          label="Sets"
          value={String(exercise.targetSets || '')}
          placeholder="3"
          onChangeText={(value) =>
            onUpdate({ targetSets: parseOptionalInteger(value) ?? 0 })
          }
        />
        <PlannedInput
          label="Reps"
          value={numberInputValue(exercise.targetReps)}
          placeholder="10"
          onChangeText={(value) => onUpdate({ targetReps: parseOptionalInteger(value) })}
        />
        <PlannedInput
          label="Weight"
          value={numberInputValue(exercise.targetWeight)}
          placeholder="Optional"
          decimal
          onChangeText={(value) => onUpdate({ targetWeight: parseOptionalNumber(value) })}
        />
        <PlannedInput
          label="Rest"
          value={numberInputValue(exercise.restSeconds)}
          placeholder="Sec"
          onChangeText={(value) => onUpdate({ restSeconds: parseOptionalInteger(value) })}
        />
      </View>
    </AppCard>
  );
}

function PlannedInput({
  label,
  value,
  placeholder,
  decimal = false,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  decimal?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.plannedInputWrap}>
      <Text style={styles.plannedInputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.plannedInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        returnKeyType="done"
        selectTextOnFocus
      />
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
    minWidth: 64,
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
  nameInput: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    padding: 0,
  },
  descriptionInput: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    minHeight: 56,
    padding: 0,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  goalWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  goalChipActive: {
    backgroundColor: glow.goldFaint,
    borderColor: glow.goldStrong,
  },
  goalChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  goalChipTextActive: {
    color: colors.gold,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  exerciseGroup: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  iconBtn: {
    padding: spacing.xs,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  plannedInputWrap: {
    width: '48%',
  },
  plannedInputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  plannedInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: 0,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  libraryName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  libraryGroup: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
