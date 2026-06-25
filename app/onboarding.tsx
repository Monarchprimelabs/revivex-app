import React, { useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../src/components/AppCard';
import BrandTagline from '../src/components/BrandTagline';
import PrimaryButton from '../src/components/PrimaryButton';
import { useProfile } from '../src/context/ProfileContext';
import {
  DISTANCE_UNIT_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  TRAINING_FOCUS_OPTIONS,
  WEEKLY_TARGET_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  formatWeeklyTarget,
} from '../src/data/profileOptions';
import { colors, fontSize, fontWeight, radius, spacing } from '../src/theme/theme';
import type {
  ExperienceLevel,
  PreferredDistanceUnit,
  PreferredWeightUnit,
  PrimaryGoal,
  TrainingFocus,
  UserProfileInput,
} from '../src/types';

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>('Hybrid');
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('Hybrid Performance');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Intermediate');
  const [weeklyTrainingTarget, setWeeklyTrainingTarget] = useState(4);
  const [preferredWeightUnit, setPreferredWeightUnit] = useState<PreferredWeightUnit>('lb');
  const [preferredDistanceUnit, setPreferredDistanceUnit] = useState<PreferredDistanceUnit>('mi');

  const progressWidth = useMemo(
    () => `${Math.round((step / TOTAL_STEPS) * 100)}%` as `${number}%`,
    [step]
  );

  const profileInput: UserProfileInput = {
    displayName: displayName.trim(),
    username: username.trim() || undefined,
    trainingFocus,
    primaryGoal,
    experienceLevel,
    weeklyTrainingTarget,
    preferredWeightUnit,
    preferredDistanceUnit,
  };

  const canContinue = () => {
    if (step === 2 && !displayName.trim()) {
      Alert.alert('Name needed', 'Enter a display name to personalize ReviveX.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const handleBack = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  const handleFinish = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name needed', 'Enter a display name before starting.');
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      await completeOnboarding(profileInput);
      router.replace('/');
    } catch (err) {
      console.warn('Failed to finish onboarding:', err);
      Alert.alert('Could not save profile', 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.stepText}>
            {step} / {TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 ? <WelcomeStep /> : null}
          {step === 2 ? (
            <NameStep
              displayName={displayName}
              username={username}
              onDisplayNameChange={setDisplayName}
              onUsernameChange={setUsername}
            />
          ) : null}
          {step === 3 ? (
            <ChoiceStep
              eyebrow="Training focus"
              title="What are you building?"
              subtitle="Pick the lane ReviveX should emphasize first."
              options={TRAINING_FOCUS_OPTIONS}
              value={trainingFocus}
              onChange={(value) => setTrainingFocus(value as TrainingFocus)}
            />
          ) : null}
          {step === 4 ? (
            <ChoiceStep
              eyebrow="Primary goal"
              title="Choose your main outcome"
              subtitle="You can change this any time from Profile."
              options={PRIMARY_GOAL_OPTIONS}
              value={primaryGoal}
              onChange={(value) => setPrimaryGoal(value as PrimaryGoal)}
            />
          ) : null}
          {step === 5 ? (
            <PreferencesStep
              experienceLevel={experienceLevel}
              weeklyTrainingTarget={weeklyTrainingTarget}
              preferredWeightUnit={preferredWeightUnit}
              preferredDistanceUnit={preferredDistanceUnit}
              onExperienceChange={setExperienceLevel}
              onWeeklyTargetChange={setWeeklyTrainingTarget}
              onWeightUnitChange={setPreferredWeightUnit}
              onDistanceUnitChange={setPreferredDistanceUnit}
            />
          ) : null}
          {step === 6 ? (
            <FinishStep
              displayName={displayName.trim() || 'ReviveX Athlete'}
              trainingFocus={trainingFocus}
              primaryGoal={primaryGoal}
              weeklyTrainingTarget={weeklyTrainingTarget}
              preferredWeightUnit={preferredWeightUnit}
              preferredDistanceUnit={preferredDistanceUnit}
            />
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}

          <PrimaryButton
            label={step === TOTAL_STEPS ? 'Start Training' : 'Continue'}
            variant="primary"
            loading={saving}
            onPress={step === TOTAL_STEPS ? handleFinish : handleNext}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  return (
    <View>
      <View style={styles.brandBlock}>
        <View style={styles.brandRail} />
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>Revive</Text>
            <Text style={styles.brandX}>X</Text>
          </View>
          <BrandTagline style={styles.tagline} />
        </View>
      </View>

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.xl }}>
        <Text style={styles.heroTitle}>Track lifting, running, conditioning, and progress in one place.</Text>
        <Text style={styles.heroSub}>
          Set up your profile so ReviveX can tune the dashboard around how you train.
        </Text>
      </AppCard>
    </View>
  );
}

function NameStep({
  displayName,
  username,
  onDisplayNameChange,
  onUsernameChange,
}: {
  displayName: string;
  username: string;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
}) {
  return (
    <View>
      <StepHeader
        eyebrow="Profile"
        title="What should we call you?"
        subtitle="Your profile is local and private for now."
      />

      <AppCard style={{ marginTop: spacing.lg }}>
        <FieldLabel label="Display name" />
        <TextInput
          value={displayName}
          onChangeText={onDisplayNameChange}
          style={styles.input}
          placeholder="George"
          placeholderTextColor={colors.textMuted}
          maxLength={60}
        />

        <FieldLabel label="Username" style={{ marginTop: spacing.md }} />
        <TextInput
          value={username}
          onChangeText={onUsernameChange}
          style={styles.input}
          placeholder="Optional, local only"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
        />
        <Text style={styles.helperText}>
          This is not a public account yet. Community features are coming later.
        </Text>
      </AppCard>
    </View>
  );
}

function ChoiceStep({
  eyebrow,
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <StepHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <View style={styles.choiceList}>
        {options.map((option) => (
          <ChoiceCard
            key={option}
            label={option}
            selected={option === value}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

function PreferencesStep({
  experienceLevel,
  weeklyTrainingTarget,
  preferredWeightUnit,
  preferredDistanceUnit,
  onExperienceChange,
  onWeeklyTargetChange,
  onWeightUnitChange,
  onDistanceUnitChange,
}: {
  experienceLevel: ExperienceLevel;
  weeklyTrainingTarget: number;
  preferredWeightUnit: PreferredWeightUnit;
  preferredDistanceUnit: PreferredDistanceUnit;
  onExperienceChange: (value: ExperienceLevel) => void;
  onWeeklyTargetChange: (value: number) => void;
  onWeightUnitChange: (value: PreferredWeightUnit) => void;
  onDistanceUnitChange: (value: PreferredDistanceUnit) => void;
}) {
  return (
    <View>
      <StepHeader
        eyebrow="Preferences"
        title="Set your defaults"
        subtitle="These keep logging fast without changing your saved history."
      />

      <PreferenceGroup label="Experience">
        <ChipRow
          options={EXPERIENCE_LEVEL_OPTIONS}
          value={experienceLevel}
          onChange={(value) => onExperienceChange(value as ExperienceLevel)}
        />
      </PreferenceGroup>

      <PreferenceGroup label="Weekly target">
        <View style={styles.choiceListCompact}>
          {WEEKLY_TARGET_OPTIONS.map((target) => (
            <ChoiceCard
              key={target}
              label={formatWeeklyTarget(target)}
              selected={target === weeklyTrainingTarget}
              onPress={() => onWeeklyTargetChange(target)}
              compact
            />
          ))}
        </View>
      </PreferenceGroup>

      <PreferenceGroup label="Weight unit">
        <ChipRow
          options={WEIGHT_UNIT_OPTIONS}
          value={preferredWeightUnit}
          onChange={(value) => onWeightUnitChange(value as PreferredWeightUnit)}
        />
      </PreferenceGroup>

      <PreferenceGroup label="Distance unit">
        <ChipRow
          options={DISTANCE_UNIT_OPTIONS}
          value={preferredDistanceUnit}
          onChange={(value) => onDistanceUnitChange(value as PreferredDistanceUnit)}
        />
      </PreferenceGroup>
    </View>
  );
}

function FinishStep({
  displayName,
  trainingFocus,
  primaryGoal,
  weeklyTrainingTarget,
  preferredWeightUnit,
  preferredDistanceUnit,
}: {
  displayName: string;
  trainingFocus: TrainingFocus;
  primaryGoal: PrimaryGoal;
  weeklyTrainingTarget: number;
  preferredWeightUnit: PreferredWeightUnit;
  preferredDistanceUnit: PreferredDistanceUnit;
}) {
  return (
    <View>
      <StepHeader
        eyebrow="Ready"
        title={`Welcome to ReviveX, ${displayName}`}
        subtitle="Your local profile is ready. Time to train with a little more signal."
      />

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.lg }}>
        <SummaryRow label="Focus" value={trainingFocus} />
        <SummaryRow label="Goal" value={primaryGoal} />
        <SummaryRow label="Weekly target" value={formatWeeklyTarget(weeklyTrainingTarget)} />
        <SummaryRow label="Units" value={`${preferredWeightUnit} / ${preferredDistanceUnit}`} />
      </AppCard>
    </View>
  );
}

function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function ChoiceCard({
  label,
  selected,
  onPress,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceCard, compact && styles.choiceCardCompact, selected && styles.choiceCardSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.accentLime} /> : null}
    </Pressable>
  );
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

function PreferenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppCard style={{ marginTop: spacing.md }}>
      <FieldLabel label={label} />
      {children}
    </AppCard>
  );
}

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return <Text style={[styles.fieldLabel, style]}>{label}</Text>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTeal,
  },
  stepText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandRail: {
    width: 4,
    height: 54,
    borderRadius: 2,
    backgroundColor: colors.accentLime,
    marginRight: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: fontSize.display,
    fontWeight: fontWeight.heavy,
    fontStyle: 'italic',
  },
  brandX: {
    color: colors.accentLime,
    fontSize: fontSize.display + 4,
    fontWeight: fontWeight.heavy,
    fontStyle: 'italic',
    transform: [{ skewX: '-8deg' }],
  },
  tagline: {
    marginTop: spacing.xs,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    lineHeight: 28,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  eyebrow: {
    color: colors.accentTeal,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.heavy,
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.sm,
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
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  choiceList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  choiceListCompact: {
    gap: spacing.sm,
  },
  choiceCard: {
    minHeight: 62,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  choiceCardCompact: {
    minHeight: 52,
  },
  choiceCardSelected: {
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(198, 255, 0, 0.08)',
  },
  choiceText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  choiceTextSelected: {
    color: colors.accentLime,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  nextButton: {
    flex: 1,
  },
});
