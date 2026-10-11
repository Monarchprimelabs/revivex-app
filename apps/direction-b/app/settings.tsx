import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { parseReviveXExport } from '@revivex/core';
import { AppCard, Chip, PrimaryButton, ScreenContainer, colors, fontFamily, fontSize, spacing } from '@revivex/design-system';
import TopBar from '../src/components/TopBar';
import { DISTANCE_UNITS, EXPERIENCE_OPTIONS, FOCUS_OPTIONS, GOAL_OPTIONS, WEIGHT_UNITS, useCoach, type CoachSettings } from '../src/context/CoachContext';

const TARGETS = [2, 3, 4, 5, 6];

/** Everything the engine needs to know about you. Defaults are sensible, so Save is one tap. */
export default function SettingsScreen() {
  const { settings, saveSettings, importHistory, workouts, runs, hybridSessions } = useCoach();
  const [draft, setDraft] = useState<CoachSettings>(settings);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    setImportMessage(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const text = asset.file && typeof asset.file.text === 'function' ? await asset.file.text() : await (await fetch(asset.uri)).text();
      const parsed = parseReviveXExport(text);
      if (!parsed.ok) {
        setImportMessage(parsed.error);
        return;
      }
      const merged = importHistory(parsed.data);
      setImportMessage(`Imported ${merged.workouts} workouts, ${merged.runs} runs and ${merged.hybridSessions} hybrid sessions. The coach uses them from your next plan.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'The import failed.');
    } finally {
      setImporting(false);
    }
  };
  const update = (patch: Partial<CoachSettings>) => setDraft((current) => ({ ...current, ...patch }));

  const save = () => {
    saveSettings({ ...draft, displayName: draft.displayName.trim(), setupComplete: true });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <ScreenContainer>
      <TopBar title="Your week" />

      <AppCard>
        <Text style={styles.label}>Name (optional)</Text>
        <TextInput
          value={draft.displayName}
          onChangeText={(displayName) => update({ displayName })}
          placeholder="What should the coach call you?"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          testID="settings-name"
        />
      </AppCard>

      <Section title="Training focus">
        {FOCUS_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={draft.trainingFocus === option} onPress={() => update({ trainingFocus: option })} testID={`settings-focus-${option.replace(/\s+/g, '-')}`} />
        ))}
      </Section>

      <Section title="Primary goal">
        {GOAL_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={draft.primaryGoal === option} onPress={() => update({ primaryGoal: option })} />
        ))}
      </Section>

      <Section title="Experience">
        {EXPERIENCE_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={draft.experienceLevel === option} onPress={() => update({ experienceLevel: option })} />
        ))}
      </Section>

      <Section title="Days per week">
        {TARGETS.map((target) => (
          <Chip key={target} label={String(target)} selected={draft.weeklyTrainingTarget === target} onPress={() => update({ weeklyTrainingTarget: target })} testID={`settings-days-${target}`} />
        ))}
      </Section>

      <Section title="Units">
        {WEIGHT_UNITS.map((unit) => (
          <Chip key={unit} label={unit} selected={draft.preferredWeightUnit === unit} onPress={() => update({ preferredWeightUnit: unit })} />
        ))}
        <View style={{ width: spacing.md }} />
        {DISTANCE_UNITS.map((unit) => (
          <Chip key={unit} label={unit} selected={draft.preferredDistanceUnit === unit} onPress={() => update({ preferredDistanceUnit: unit })} />
        ))}
      </Section>

      <View style={{ marginTop: spacing.xl }}>
        <Text style={styles.sectionTitle}>Training history</Text>
        <AppCard>
          <Text style={styles.body}>
            {workouts.length + runs.length + hybridSessions.length > 0
              ? `${workouts.length} workouts, ${runs.length} runs and ${hybridSessions.length} hybrid sessions on record.`
              : 'No history yet. Import an export from the Revive X tracker (Profile → Your Data → Export) and the coach starts from your real training.'}
          </Text>
          <View testID="settings-import">
            <PrimaryButton label="Import Revive X export" variant="outline" onPress={() => void handleImport()} loading={importing} style={{ marginTop: spacing.md }} />
          </View>
          {importMessage ? <Text style={styles.importMessage}>{importMessage}</Text> : null}
        </AppCard>
      </View>

      <Text style={styles.note}>Changing your focus or days rebuilds today's plan the next time you check in.</Text>
      <View testID="settings-save">
        <PrimaryButton label="Save" onPress={save} style={{ marginTop: spacing.lg }} />
      </View>
      <View style={{ height: spacing.xxl }} />
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: 6, fontFamily: fontFamily.medium },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontFamily: fontFamily.bold, marginBottom: spacing.sm },
  body: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20, fontFamily: fontFamily.regular },
  importMessage: { color: colors.accentTeal, fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.md, fontFamily: fontFamily.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  note: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.lg, lineHeight: 17, fontFamily: fontFamily.regular },
});
