import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  completionHasWork,
  defaultCompletion,
  strengthBlocksOf,
  type LiftCompletion,
  type PlanCompletion,
} from '@revivex/coach';
import { AppCard, Chip, PrimaryButton, ScreenContainer, colors, fontFamily, fontSize, spacing } from '@revivex/design-system';
import { useCoach } from '../src/context/CoachContext';

/**
 * "What I actually did." Prefilled with the plan; edit loads, reps, done
 * flags, skip an exercise, or change distance and time, then save.
 */
export default function CompleteScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const coach = useCoach();
  const record = coach.plans.find((plan) => plan.id === planId);
  const plan = record ? coach.dayPlanOf(record) : undefined;
  const initial = useMemo(() => (plan ? defaultCompletion(plan) : undefined), [plan]);

  const [weights, setWeights] = useState<Record<string, string>>(() => seedWeights(initial));
  const [reps, setReps] = useState<Record<string, string>>(() => seedReps(initial));
  const [done, setDone] = useState<Record<string, boolean>>(() => seedDone(initial));
  const [skipped, setSkipped] = useState<Record<number, boolean>>({});
  const [minutes, setMinutes] = useState(() => String(Math.round(((initial && 'durationSeconds' in initial ? initial.durationSeconds : 0) ?? 0) / 60)));
  const [distance, setDistance] = useState(() => (initial?.kind === 'run' ? String(initial.distance) : ''));

  if (!record || !plan || !initial) {
    return (
      <ScreenContainer>
        <Header title="Log session" />
        <AppCard>
          <Text style={styles.body}>This plan is not on this device.</Text>
        </AppCard>
      </ScreenContainer>
    );
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const buildCompletion = (): PlanCompletion => {
    const seconds = Math.max(0, Math.round(parseNumber(minutes) * 60));
    if (initial.kind === 'lift') {
      const blocks = strengthBlocksOf(plan).map((block, blockIndex) => ({
        exerciseId: block.exerciseId,
        skipped: Boolean(skipped[blockIndex]),
        sets: Array.from({ length: block.sets }, (_, setIndex) => {
          const key = `${blockIndex}-${setIndex}`;
          const weight = parseNumber(weights[key]);
          return { weight: weight > 0 ? weight : undefined, reps: Math.floor(parseNumber(reps[key])), completed: done[key] !== false };
        }),
      }));
      return { kind: 'lift', durationSeconds: seconds, blocks };
    }
    if (initial.kind === 'run') return { kind: 'run', distance: parseNumber(distance), durationSeconds: seconds };
    if (initial.kind === 'hybrid') return { kind: 'hybrid', durationSeconds: seconds };
    return initial;
  };

  const completion = buildCompletion();
  const canSave = completionHasWork(completion);

  const save = () => {
    coach.completePlan(record.id, completion);
    close();
  };

  return (
    <ScreenContainer>
      <Header title="Log session" onClose={close} />
      <Text style={styles.planTitle}>{plan.title}</Text>
      <Text style={styles.hint}>Prefilled from the plan. Change anything you did differently, then save.</Text>

      {initial.kind === 'lift'
        ? strengthBlocksOf(plan).map((block, blockIndex) => {
            const isSkipped = Boolean(skipped[blockIndex]);
            return (
              <AppCard key={`${block.exerciseId}-${blockIndex}`} style={[styles.card, isSkipped && styles.cardSkipped]}>
                <View style={styles.blockHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.blockTitle}>{block.exerciseName}</Text>
                    <Text style={styles.blockMeta}>
                      Planned {block.sets} × {block.reps}
                      {block.targetWeight ? ` at ${block.targetWeight} ${block.weightUnit}` : ''}
                    </Text>
                  </View>
                  <Chip label={isSkipped ? 'Skipped' : 'Skip'} selected={isSkipped} onPress={() => setSkipped((current) => ({ ...current, [blockIndex]: !isSkipped }))} testID={`complete-skip-${blockIndex}`} />
                </View>
                {!isSkipped ? (
                  <>
                    <View style={styles.setHeader}>
                      <Text style={[styles.colLabel, styles.colSet]}>Set</Text>
                      <Text style={[styles.colLabel, styles.colInput]}>{block.weightUnit}</Text>
                      <Text style={[styles.colLabel, styles.colInput]}>Reps</Text>
                      <Text style={[styles.colLabel, styles.colDone]}>Done</Text>
                    </View>
                    {Array.from({ length: block.sets }, (_, setIndex) => {
                      const key = `${blockIndex}-${setIndex}`;
                      const isDone = done[key] !== false;
                      return (
                        <View key={key} style={[styles.setRow, !isDone && styles.setRowOff]}>
                          <Text style={[styles.setNumber, styles.colSet]}>{setIndex + 1}</Text>
                          <TextInput
                            value={weights[key] ?? ''}
                            onChangeText={(value) => setWeights((current) => ({ ...current, [key]: value }))}
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="decimal-pad"
                            style={[styles.input, styles.colInput]}
                            testID={`complete-set-weight-${blockIndex}-${setIndex}`}
                          />
                          <TextInput
                            value={reps[key] ?? ''}
                            onChangeText={(value) => setReps((current) => ({ ...current, [key]: value }))}
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="number-pad"
                            style={[styles.input, styles.colInput]}
                            testID={`complete-set-reps-${blockIndex}-${setIndex}`}
                          />
                          <Pressable onPress={() => setDone((current) => ({ ...current, [key]: !isDone }))} hitSlop={8} style={styles.colDone} testID={`complete-set-done-${blockIndex}-${setIndex}`} accessibilityRole="checkbox" accessibilityState={{ checked: isDone }}>
                            <View style={[styles.checkbox, isDone && styles.checkboxOn]}>{isDone ? <Ionicons name="checkmark" size={14} color={colors.background} /> : null}</View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </>
                ) : null}
              </AppCard>
            );
          })
        : null}

      {initial.kind === 'run' ? (
        <AppCard style={styles.card}>
          <Text style={styles.blockTitle}>Distance</Text>
          <TextInput value={distance} onChangeText={setDistance} keyboardType="decimal-pad" style={styles.wideInput} testID="complete-distance" placeholder="0" placeholderTextColor={colors.textMuted} />
          <Text style={styles.blockMeta}>{plan.blocks[0]?.type === 'run' ? plan.blocks[0].distanceUnit : ''}</Text>
        </AppCard>
      ) : null}

      {initial.kind !== 'recovery' && initial.kind !== 'rest' ? (
        <AppCard style={styles.card}>
          <Text style={styles.blockTitle}>Time</Text>
          <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" style={styles.wideInput} testID="complete-duration" placeholder="0" placeholderTextColor={colors.textMuted} />
          <Text style={styles.blockMeta}>minutes</Text>
        </AppCard>
      ) : null}

      {!canSave ? <Text style={styles.warn}>Log at least one set, or some distance and time, to save.</Text> : null}
      <View testID="complete-save">
        <PrimaryButton label="Save session" onPress={save} disabled={!canSave} style={{ marginTop: spacing.lg }} />
      </View>
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

function Header({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onClose ?? (() => router.back())} hitSlop={8} testID="complete-close" accessibilityLabel="Close">
        <Ionicons name="close" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

function parseNumber(value: string | undefined): number {
  const parsed = parseFloat((value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function seedWeights(initial: PlanCompletion | undefined): Record<string, string> {
  if (initial?.kind !== 'lift') return {};
  const out: Record<string, string> = {};
  (initial as LiftCompletion).blocks.forEach((block, b) => block.sets.forEach((set, s) => (out[`${b}-${s}`] = set.weight ? String(set.weight) : '')));
  return out;
}

function seedReps(initial: PlanCompletion | undefined): Record<string, string> {
  if (initial?.kind !== 'lift') return {};
  const out: Record<string, string> = {};
  (initial as LiftCompletion).blocks.forEach((block, b) => block.sets.forEach((set, s) => (out[`${b}-${s}`] = String(set.reps))));
  return out;
}

function seedDone(initial: PlanCompletion | undefined): Record<string, boolean> {
  if (initial?.kind !== 'lift') return {};
  const out: Record<string, boolean> = {};
  (initial as LiftCompletion).blocks.forEach((block, b) => block.sets.forEach((_set, s) => (out[`${b}-${s}`] = true)));
  return out;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  planTitle: { color: colors.text, fontSize: fontSize.xl, fontFamily: fontFamily.extrabold },
  hint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, marginBottom: spacing.md, fontFamily: fontFamily.regular },
  body: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  card: { marginBottom: spacing.md },
  cardSkipped: { opacity: 0.6 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  blockTitle: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.semibold },
  blockMeta: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2, fontFamily: fontFamily.regular },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginBottom: 4 },
  colLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: fontFamily.medium, textAlign: 'center' },
  colSet: { width: 36 },
  colInput: { flex: 1, marginHorizontal: 4 },
  colDone: { width: 44, alignItems: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  setRowOff: { opacity: 0.5 },
  setNumber: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.semibold, textAlign: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.textPrimary,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
  wideInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    marginTop: spacing.sm,
  },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accentLime, borderColor: colors.accentLime },
  warn: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.md, fontFamily: fontFamily.regular },
});
