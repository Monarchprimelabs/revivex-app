import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  fontSize,
  fontWeight,
  glow,
  radius,
  spacing,
} from '../../theme/theme';
import type { PreferredWeightUnit, WorkoutExercise, WorkoutSet } from '../../types';

// Enable LayoutAnimation on Android for smooth set add/remove
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  exercise: WorkoutExercise;
  onAddSet: () => void;
  onUpdateSet: (
    setId: string,
    patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'notes' | 'completed'>>
  ) => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
  weightUnit?: PreferredWeightUnit;
}

/**
 * ExerciseLogCard
 * One card per exercise in the active workout.
 * Renders the sets table and lets the user add/edit/remove sets.
 */
export default function ExerciseLogCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onRemoveExercise,
  weightUnit = 'kg',
}: Props) {
  const handleAddSet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onAddSet();
  };

  const handleRemoveSet = (setId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onRemoveSet(setId);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.muscleGroup}>{exercise.muscleGroup}</Text>
        </View>
        <Pressable onPress={onRemoveExercise} hitSlop={10} style={styles.menuBtn}>
          <Ionicons
            name="trash-outline"
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      {/* Sets table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, styles.colSet]}>SET</Text>
        <Text style={[styles.colHeader, styles.colWeight]}>
          WEIGHT ({weightUnit.toUpperCase()})
        </Text>
        <Text style={[styles.colHeader, styles.colReps]}>REPS</Text>
        <View style={styles.colDoneHeader}>
          <Ionicons
            name="checkmark"
            size={14}
            color={colors.textMuted}
          />
        </View>
        <View style={styles.colDelete} />
      </View>

      {/* Set rows */}
      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          onUpdate={(patch) => onUpdateSet(set.id, patch)}
          onRemove={() => handleRemoveSet(set.id)}
        />
      ))}

      {/* Add set button */}
      <Pressable onPress={handleAddSet} style={styles.addSetBtn}>
        <Ionicons name="add" size={18} color={colors.gold} />
        <Text style={styles.addSetBtnText}>Add Set</Text>
      </Pressable>
    </View>
  );
}

// ============== Set row ==============

interface SetRowProps {
  set: WorkoutSet;
  onUpdate: (
    patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'notes' | 'completed'>>
  ) => void;
  onRemove: () => void;
}

function SetRow({ set, onUpdate, onRemove }: SetRowProps) {
  // Track input strings locally so the user can type "12." or clear the field
  // without us coercing to 0 on every keystroke.
  const [weightStr, setWeightStr] = useState(
    set.weight === 0 ? '' : String(set.weight)
  );
  const [repsStr, setRepsStr] = useState(
    set.reps === 0 ? '' : String(set.reps)
  );

  const commitWeight = () => {
    const n = parseFloat(weightStr.replace(',', '.'));
    onUpdate({ weight: isNaN(n) ? 0 : n });
  };
  const commitReps = () => {
    const n = parseInt(repsStr, 10);
    onUpdate({ reps: isNaN(n) ? 0 : n });
  };

  const toggleComplete = () => {
    // If the user marks a set complete, also commit current input values
    commitWeight();
    commitReps();
    onUpdate({ completed: !set.completed });
  };

  return (
    <View
      style={[
        styles.setRow,
        set.completed && styles.setRowCompleted,
      ]}
    >
      <Text style={[styles.colCell, styles.colSet, styles.setNumber]}>
        {set.setNumber}
      </Text>

      <TextInput
        style={[styles.input, styles.colWeight]}
        value={weightStr}
        onChangeText={setWeightStr}
        onBlur={commitWeight}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
      />

      <TextInput
        style={[styles.input, styles.colReps]}
        value={repsStr}
        onChangeText={setRepsStr}
        onBlur={commitReps}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
      />

      <Pressable onPress={toggleComplete} hitSlop={6} style={styles.colDoneHeader}>
        <View
          style={[
            styles.checkbox,
            set.completed && styles.checkboxChecked,
          ]}
        >
          {set.completed ? (
            <Ionicons name="checkmark" size={14} color={colors.background} />
          ) : null}
        </View>
      </Pressable>

      <Pressable onPress={onRemove} hitSlop={6} style={styles.colDelete}>
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  muscleGroup: {
    color: colors.gold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  menuBtn: {
    padding: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  colHeader: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginVertical: 2,
  },
  setRowCompleted: {
    backgroundColor: glow.successFaint,
  },
  colCell: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  colSet: {
    width: 36,
    textAlign: 'center',
  },
  colWeight: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  colReps: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  colDoneHeader: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colDelete: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: glow.goldFaint,
    borderWidth: 1,
    borderColor: glow.goldStrong,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  addSetBtnText: {
    color: colors.gold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
});
