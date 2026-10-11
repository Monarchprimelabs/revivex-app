import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReadinessLevel } from '@revivex/core';
import { assessReadiness } from '@revivex/coach';
import { AppCard, Chip, PrimaryButton, ScreenContainer, colors, fontFamily, fontSize, spacing } from '@revivex/design-system';
import { useCoach } from '../src/context/CoachContext';

const QUESTIONS: { key: 'sleep' | 'soreness' | 'energy'; question: string; labels: string[] }[] = [
  { key: 'sleep', question: 'How did you sleep?', labels: ['Rough', 'Poor', 'Okay', 'Good', 'Great'] },
  { key: 'soreness', question: 'How sore are you?', labels: ['Fresh', 'A little', 'Moderate', 'Sore', 'Wrecked'] },
  { key: 'energy', question: 'Energy right now?', labels: ['Flat', 'Low', 'Okay', 'Good', 'Charged'] },
];

const LEVELS: ReadinessLevel[] = [1, 2, 3, 4, 5];

/** Three taps. The plan is built the moment you submit. */
export default function CheckinScreen() {
  const { todayCheckin, submitCheckin } = useCoach();
  const [sleep, setSleep] = useState<ReadinessLevel>(todayCheckin?.sleep ?? 3);
  const [soreness, setSoreness] = useState<ReadinessLevel>(todayCheckin?.soreness ?? 3);
  const [energy, setEnergy] = useState<ReadinessLevel>(todayCheckin?.energy ?? 3);
  const values = { sleep, soreness, energy };
  const setters = { sleep: setSleep, soreness: setSoreness, energy: setEnergy };
  const preview = assessReadiness(values);

  const submit = () => {
    submitCheckin(values);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Text style={styles.title}>Daily check-in</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={8} testID="checkin-close" accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {QUESTIONS.map((item) => (
        <AppCard key={item.key} style={{ marginBottom: spacing.md }}>
          <Text style={styles.question}>{item.question}</Text>
          <View style={styles.chips}>
            {LEVELS.map((level) => (
              <Chip
                key={level}
                label={item.labels[level - 1]}
                selected={values[item.key] === level}
                onPress={() => setters[item.key](level)}
                testID={`checkin-${item.key}-${level}`}
              />
            ))}
          </View>
        </AppCard>
      ))}

      <AppCard elevated tint="brand">
        <Text style={styles.previewLabel}>Readiness</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewScore} testID="checkin-preview-score">
            {preview.score}
          </Text>
          <Text style={styles.previewBand}>/100 · {preview.band}</Text>
        </View>
        <Text style={styles.previewText}>{preview.summary}</Text>
        <View testID="checkin-submit">
          <PrimaryButton label="Build today's plan" onPress={submit} style={{ marginTop: spacing.md }} />
        </View>
      </AppCard>
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontFamily: fontFamily.bold },
  question: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.semibold, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  previewLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  previewRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  previewScore: { color: colors.text, fontSize: fontSize.display, fontFamily: fontFamily.extrabold },
  previewBand: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: fontFamily.medium },
  previewText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, marginTop: 4, fontFamily: fontFamily.regular },
});
