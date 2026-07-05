import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, radius, spacing } from '../../theme/theme';
import {
  barsForUnit,
  calculatePlates,
  defaultBarForUnit,
  platesForUnit,
} from '../../utils/plateMath';
import type { PreferredWeightUnit } from '../../types';

/**
 * Bottom-sheet plate calculator: enter a target weight, pick a bar,
 * see the plates to load on each side.
 */
export default function PlateCalculatorModal({
  visible,
  initialWeight,
  unit,
  onClose,
}: {
  visible: boolean;
  initialWeight: number;
  unit: PreferredWeightUnit;
  onClose: () => void;
}) {
  const [weightStr, setWeightStr] = useState('');
  const [barWeight, setBarWeight] = useState(defaultBarForUnit(unit));

  // Re-seed the input each time the sheet opens.
  const [seededFor, setSeededFor] = useState<number | null>(null);
  if (visible && seededFor !== initialWeight) {
    setSeededFor(initialWeight);
    setWeightStr(initialWeight > 0 ? String(initialWeight) : '');
  }
  if (!visible && seededFor !== null) {
    setSeededFor(null);
  }

  const target = Number.parseFloat(weightStr.replace(',', '.')) || 0;
  const breakdown = useMemo(
    () => calculatePlates(target, barWeight, platesForUnit(unit)),
    [target, barWeight, unit]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Plate Calculator</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.label}>Target weight ({unit})</Text>
          <TextInput
            value={weightStr}
            onChangeText={setWeightStr}
            style={styles.weightInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Bar</Text>
          <View style={styles.barRow}>
            {barsForUnit(unit).map((bar) => {
              const selected = bar === barWeight;
              return (
                <Pressable
                  key={bar}
                  onPress={() => setBarWeight(bar)}
                  style={[styles.barChip, selected && styles.barChipSelected]}
                >
                  <Text style={[styles.barChipText, selected && styles.barChipTextSelected]}>
                    {bar} {unit}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.resultCard}>
            {target <= 0 ? (
              <Text style={styles.hint}>Enter a target weight to see the plates.</Text>
            ) : breakdown.belowBar ? (
              <Text style={styles.hint}>
                Target is below the {breakdown.barWeight} {unit} bar. Use a lighter bar or
                dumbbells.
              </Text>
            ) : breakdown.perSide.length === 0 ? (
              <Text style={styles.hint}>Just the bar — no plates needed.</Text>
            ) : (
              <>
                <Text style={styles.perSideLabel}>Each side</Text>
                {breakdown.perSide.map((item) => (
                  <View key={item.plate} style={styles.plateRow}>
                    <View style={styles.plateChip}>
                      <Text style={styles.plateChipText}>{item.plate}</Text>
                    </View>
                    <Text style={styles.plateCount}>× {item.count}</Text>
                  </View>
                ))}
              </>
            )}

            {target > 0 && !breakdown.belowBar ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Loads to</Text>
                <Text style={styles.totalValue}>
                  {breakdown.achievedWeight} {unit}
                </Text>
              </View>
            ) : null}

            {breakdown.remainder > 0 ? (
              <Text style={styles.remainder}>
                {breakdown.remainder} {unit} short of target — smallest plate is{' '}
                {platesForUnit(unit)[platesForUnit(unit).length - 1]} {unit}.
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.xs,
  },
  weightInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  barChipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.10)',
  },
  barChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  barChipTextSelected: {
    color: colors.accentTeal,
  },
  resultCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  perSideLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  plateChip: {
    minWidth: 56,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(198, 255, 0, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  plateChipText: {
    color: colors.accentLime,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  plateCount: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  totalValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  remainder: {
    color: colors.gold,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
