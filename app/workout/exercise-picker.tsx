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
  const { addExerciseToWorkout } = useWorkout();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? exerciseLibrary.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.muscleGroup.toLowerCase().includes(q)
        )
      : exerciseLibrary;

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
  }, [query]);

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

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                  <Text style={styles.rowName}>{ex.name}</Text>
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
  rowName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
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
