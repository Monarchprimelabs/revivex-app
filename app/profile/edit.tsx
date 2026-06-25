import React, { useState } from 'react';
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
import { useProfile } from '../../src/context/ProfileContext';
import {
  DISTANCE_UNIT_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  TRAINING_FOCUS_OPTIONS,
  WEEKLY_TARGET_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  formatWeeklyTarget,
} from '../../src/data/profileOptions';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import type {
  ExperienceLevel,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  TrainingFocus,
} from '../../src/types';

export default function EditProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>(
    profile?.trainingFocus ?? 'Hybrid'
  );
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    profile?.primaryGoal ?? 'Hybrid Performance'
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    profile?.experienceLevel ?? 'Intermediate'
  );
  const [weeklyTrainingTarget, setWeeklyTrainingTarget] = useState(
    profile?.weeklyTrainingTarget ?? 4
  );
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<PreferredWeightUnit>(
    profile?.preferredWeightUnit ?? 'lb'
  );
  const [preferredDistanceUnit, setPreferredDistanceUnit] = useState<PreferredDistanceUnit>(
    profile?.preferredDistanceUnit ?? 'mi'
  );

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name needed', 'Display name cannot be blank.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName,
        username,
        trainingFocus,
        primaryGoal,
        experienceLevel,
        weeklyTrainingTarget,
        preferredWeightUnit,
        preferredDistanceUnit,
      });
      router.back();
    } catch (err) {
      console.warn('Failed to update profile:', err);
      Alert.alert('Could not save profile', 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Edit Profile</Text>
          <View style={styles.topBarBtn} />
        </View>
        <View style={styles.missingWrap}>
          <Text style={styles.missingTitle}>Profile not set up</Text>
          <Text style={styles.missingText}>Complete onboarding before editing profile preferences.</Text>
          <PrimaryButton
            label="Start Onboarding"
            variant="primary"
            onPress={() => router.replace('/onboarding')}
            style={{ marginTop: spacing.lg, width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Edit Profile</Text>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Update your local ReviveX identity and defaults.</Text>

          <AppCard style={{ marginTop: spacing.lg }}>
            <FieldLabel label="Display name" />
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              placeholder="Display name"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />

            <FieldLabel label="Username" style={{ marginTop: spacing.md }} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholder="Optional, local only"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={32}
            />
            <Text style={styles.helperText}>This remains private until community features exist.</Text>
          </AppCard>

          <PreferenceCard label="Training focus">
            <ChipRow
              options={TRAINING_FOCUS_OPTIONS}
              value={trainingFocus}
              onChange={(value) => setTrainingFocus(value as TrainingFocus)}
            />
          </PreferenceCard>

          <PreferenceCard label="Primary goal">
            <View style={styles.choiceList}>
              {PRIMARY_GOAL_OPTIONS.map((goal) => (
                <ChoiceRow
                  key={goal}
                  label={goal}
                  selected={goal === primaryGoal}
                  onPress={() => setPrimaryGoal(goal)}
                />
              ))}
            </View>
          </PreferenceCard>

          <PreferenceCard label="Experience">
            <ChipRow
              options={EXPERIENCE_LEVEL_OPTIONS}
              value={experienceLevel}
              onChange={(value) => setExperienceLevel(value as ExperienceLevel)}
            />
          </PreferenceCard>

          <PreferenceCard label="Weekly training target">
            <View style={styles.choiceList}>
              {WEEKLY_TARGET_OPTIONS.map((target) => (
                <ChoiceRow
                  key={target}
                  label={formatWeeklyTarget(target)}
                  selected={target === weeklyTrainingTarget}
                  onPress={() => setWeeklyTrainingTarget(target)}
                />
              ))}
            </View>
          </PreferenceCard>

          <PreferenceCard label="Weight unit">
            <ChipRow
              options={WEIGHT_UNIT_OPTIONS}
              value={preferredWeightUnit}
              onChange={(value) => setPreferredWeightUnit(value as PreferredWeightUnit)}
            />
          </PreferenceCard>

          <PreferenceCard label="Distance unit">
            <ChipRow
              options={DISTANCE_UNIT_OPTIONS}
              value={preferredDistanceUnit}
              onChange={(value) => setPreferredDistanceUnit(value as PreferredDistanceUnit)}
            />
          </PreferenceCard>

          <PrimaryButton
            label="Save Profile"
            variant="primary"
            loading={saving}
            onPress={handleSave}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PreferenceCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppCard style={{ marginTop: spacing.md }}>
      <FieldLabel label={label} />
      {children}
    </AppCard>
  );
}

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return <Text style={[styles.label, style]}>{label}</Text>;
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ChoiceRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceRow, selected && styles.choiceRowSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={18} color={colors.accentLime} /> : null}
    </Pressable>
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
  topTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  saveButton: {
    width: 64,
    alignItems: 'flex-end',
  },
  saveText: {
    color: colors.accentTeal,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  chipTextSelected: {
    color: colors.accentTeal,
  },
  choiceList: {
    gap: spacing.sm,
  },
  choiceRow: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  choiceRowSelected: {
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(198, 255, 0, 0.08)',
  },
  choiceText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  choiceTextSelected: {
    color: colors.accentLime,
  },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  missingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
