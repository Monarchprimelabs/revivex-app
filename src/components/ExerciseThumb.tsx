import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { exerciseImages } from '../data/exerciseImages';
import { colors, radius } from '../theme/theme';
import type { MuscleGroup } from '../types';

/**
 * Exercise thumbnail: a real demonstration photo (public-domain pack, see
 * src/data/exerciseImages.ts) shown next to exercise names, Hevy-style.
 * Custom exercises without a bundled photo fall back to a movement
 * pictogram on a muscle-group colored tile.
 */

type MciName = keyof typeof MaterialCommunityIcons.glyphMap;

function iconFor(name: string): MciName {
  const n = name.toLowerCase();
  if (/(run|sprint|treadmill)/.test(n)) return 'run';
  if (/(plank|crunch|sit-up|situp|core|ab )/.test(n)) return 'yoga';
  if (/(dumbbell|db |fly|raise|hammer)/.test(n)) return 'dumbbell';
  if (/(curl)/.test(n)) return 'arm-flex';
  if (/(pulldown|pushdown|cable|row)/.test(n)) return 'weight';
  if (/(kettlebell|swing|carry)/.test(n)) return 'kettlebell';
  // Compound bar work and machines: the lifter pictogram.
  return 'weight-lifter';
}

const MUSCLE_COLORS: Partial<Record<MuscleGroup, string>> = {
  Chest: colors.accentLime,
  Back: colors.accentTeal,
  Shoulders: colors.accentCoral,
  Biceps: colors.techCool,
  Triceps: colors.techCool,
  Quads: colors.gold,
  Hamstrings: colors.gold,
  Glutes: colors.gold,
  Calves: colors.gold,
  Core: colors.success,
  Cardio: colors.accentTeal,
  Hybrid: colors.accentCoral,
};

export default function ExerciseThumb({
  name,
  muscleGroup,
  exerciseId,
  size = 40,
}: {
  name: string;
  muscleGroup: MuscleGroup;
  exerciseId?: string;
  size?: number;
}) {
  const color = MUSCLE_COLORS[muscleGroup] ?? colors.accentTeal;
  const image = exerciseId ? exerciseImages[exerciseId] : undefined;

  if (image) {
    return (
      <Image
        source={image}
        style={[
          styles.photo,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}1A`, // ~10% alpha tile wash
          borderColor: `${color}55`,
        },
      ]}
    >
      <MaterialCommunityIcons name={iconFor(name)} size={size * 0.55} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  tile: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
