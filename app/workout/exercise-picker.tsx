import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ExerciseThumb from '../../src/components/ExerciseThumb';
import { useWorkout } from '../../src/context/WorkoutContext';
import {
  exerciseLibrary,
  muscleGroupDisplayOrder,
} from '../../src/data/exerciseLibrary';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import type { Exercise } from '../../src/types';

/**
 * Exercise Picker
 * Presented as a modal from the active workout screen.
 * Tapping an exercise adds it to the active workout and dismisses.
 */
export default function ExercisePickerScreen() {
  const { addExerciseToWorkout, history } = useWorkout();
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string>('All');

  // Hevy-style Recent Exercises: latest unique exercises from history.
  const recents = useMemo(() => {
    const seen = new Set<string>();
    const out: Exercise[] = [];
    for (const workout of history) {
      for (const exercise of workout.exercises) {
        const key = exercise.exerciseId || exercise.exerciseName;
        if (seen.has(key)) continue;
        seen.add(key);
        const libraryMatch = exerciseLibrary.find((item) => item.id === exercise.exerciseId);
        out.push(
          libraryMatch ?? {
            id: exercise.exerciseId,
            name: exercise.exerciseName,
            muscleGroup: exercise.muscleGroup,
          }
        );
        if (out.length >= 6) return out;
      }
    }
    return out;
  }, [history]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = q
      ? exerciseLibrary.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.muscleGroup.toLowerCase().includes(q)
        )
      : exerciseLibrary;
    if (muscleFilter !== 'All') {
      filtered = filtered.filter((e) => e.muscleGroup === muscleFilter);
    }

    // Bucket by muscle group
    const buckets: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      const key = ex.muscleGroup;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(ex);
    }

    // Preserve display order, skip empty buckets
    return muscleGroupDisplayOrder
      .filter((g) => buckets[g]?.length)
      .map((g) => ({ group: g, items: buckets[g] }));
  }, [query, muscleFilter]);

  const showRecents = recents.length > 0 && query.trim() === '' && muscleFilter === 'All';

  const handleSelect = (exercise: Exercise) => {
    addExerciseToWorkout(exercise);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Add Exercise</Text>
        <View style={styles.topBarBtn} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises or muscle group"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Muscle group filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {['All', ...muscleGroupDisplayOrder].map((group) => {
          const selected = group === muscleFilter;
          return (
            <Pressable
              key={group}
              onPress={() => setMuscleFilter(group)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {group}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showRecents ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Recent</Text>
            <View style={styles.sectionCard}>
              {recents.map((ex, idx) => (
                <Pressable
                  key={`recent-${ex.id}`}
                  onPress={() => handleSelect(ex)}
                  style={({ pressed }) => [
                    styles.row,
                    idx !== recents.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <ExerciseThumb name={ex.name} muscleGroup={ex.muscleGroup} />
                    <View style={{ flexShrink: 1 }}>
                      <Text style={styles.rowName}>{ex.name}</Text>
                      <Text style={styles.rowSub}>{ex.muscleGroup}</Text>
                    </View>
                  </View>
                  <Ionicons name="add-circle" size={22} color={colors.gold} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySub}>Try a different search term.</Text>
          </View>
        ) : null}

        {grouped.map(({ group, items }) => (
          <View key={group} style={styles.section}>
            <Text style={styles.sectionHeader}>{group}</Text>
            <View style={styles.sectionCard}>
              {items.map((ex, idx) => (
                <Pressable
                  key={ex.id}
                  onPress={() => handleSelect(ex)}
                  style={({ pressed }) => [
                    styles.row,
                    idx !== items.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <ExerciseThumb name={ex.name} muscleGroup={ex.muscleGroup} />
                    <Text style={styles.rowName}>{ex.name}</Text>
                  </View>
                  <Ionicons
                    name="add-circle"
                    size={22}
                    color={colors.gold}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

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
    width: 60,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: 0,
  },
  scroll: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  chipScroll: {
    flexGrow: 0,
    marginTop: spacing.md,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.10)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chipTextSelected: {
    color: colors.accentTeal,
  },
  rowName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
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
