import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPaceSeconds, type PlanBlock } from '@revivex/coach';
import { colors, fontFamily, fontSize, spacing } from '@revivex/design-system';

function restLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, '0')}`;
}

/** Renders the blocks of a plan: one row per exercise, run, hybrid circuit or recovery item. */
export default function PlanBlocks({ blocks, compact = false, onSwap }: { blocks: PlanBlock[]; compact?: boolean; onSwap?: (index: number) => void }) {
  return (
    <View style={styles.list}>
      {blocks.map((block, index) => {
        if (block.type === 'strength') {
          const load = block.targetWeight ? `${block.targetWeight} ${block.weightUnit}` : 'choose load';
          return (
            <View key={`${block.exerciseId}-${index}`} style={styles.row} testID={`plan-block-${index}`}>
              <View style={styles.icon}>
                <Ionicons name="barbell-outline" size={18} color={colors.modalityStrength} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{block.exerciseName}</Text>
                <Text style={styles.meta}>
                  {block.sets} × {block.reps} · {load} · rest {restLabel(block.restSeconds)}
                </Text>
                {!compact && block.note ? <Text style={styles.note}>{block.note}</Text> : null}
              </View>
              {onSwap ? (
                <Pressable onPress={() => onSwap(index)} hitSlop={8} style={styles.swap} testID={`plan-swap-${index}`} accessibilityLabel={`Swap ${block.exerciseName}`}>
                  <Ionicons name="swap-horizontal-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.swapText}>Swap</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }
        if (block.type === 'run') {
          return (
            <View key={`run-${index}`} style={styles.row} testID={`plan-block-${index}`}>
              <View style={styles.icon}>
                <Ionicons name="walk-outline" size={18} color={colors.modalityRun} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{block.runType}</Text>
                <Text style={styles.meta}>
                  {block.distance} {block.distanceUnit} · {formatPaceSeconds(block.targetPaceSeconds, block.distanceUnit)}
                </Text>
                {!compact && block.note ? <Text style={styles.note}>{block.note}</Text> : null}
              </View>
            </View>
          );
        }
        if (block.type === 'hybrid') {
          return (
            <View key={`hybrid-${index}`} style={styles.row} testID={`plan-block-${index}`}>
              <View style={styles.icon}>
                <Ionicons name="flash-outline" size={18} color={colors.modalityHybrid} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{block.sessionType}</Text>
                <Text style={styles.meta}>
                  {block.rounds} round{block.rounds === 1 ? '' : 's'} · {block.segments.map((segment) => segment.name).join(' → ')}
                </Text>
                {!compact && block.note ? <Text style={styles.note}>{block.note}</Text> : null}
              </View>
            </View>
          );
        }
        return (
          <View key={`recovery-${index}`} style={styles.row} testID={`plan-block-${index}`}>
            <View style={styles.icon}>
              <Ionicons name="leaf-outline" size={18} color={colors.accentTeal} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{block.activity}</Text>
              <Text style={styles.meta}>{block.durationMinutes} min</Text>
              {!compact && block.note ? <Text style={styles.note}>{block.note}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: 6 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  swap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4, alignSelf: 'flex-start' },
  swapText: { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.semibold },
  title: { color: colors.textPrimary, fontSize: fontSize.md, fontFamily: fontFamily.semibold },
  meta: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2, fontFamily: fontFamily.regular },
  note: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4, lineHeight: 17, fontFamily: fontFamily.regular },
});
