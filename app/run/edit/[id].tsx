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
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import PrimaryButton from '../../../src/components/PrimaryButton';
import AppCard from '../../../src/components/AppCard';
import { useRuns } from '../../../src/context/RunContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/theme/theme';
import type { DistanceUnit, RunType } from '../../../src/types';

const RUN_TYPES: RunType[] = [
  'Outdoor',
  'Treadmill',
  'Easy Run',
  'Tempo',
  'Intervals',
  'Long Run',
  'Recovery Run',
  'Race',
  'Other',
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function dateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeDateInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseNumber(value: string): number {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseWholeNumber(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function splitDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  return {
    hours: String(Math.floor(safe / 3600)),
    minutes: String(Math.floor((safe % 3600) / 60)),
    seconds: String(safe % 60),
  };
}

export default function EditRunScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const runId = firstParam(params.id);
  const { getRunById, updateRun } = useRuns();
  const run = runId ? getRunById(runId) : undefined;

  const initialDuration = splitDuration(run?.durationSeconds ?? 0);
  const [title, setTitle] = useState(run?.title ?? '');
  const [date, setDate] = useState(run ? dateInputValue(run.date) : '');
  const [distance, setDistance] = useState(run ? String(run.distance) : '');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(run?.distanceUnit ?? 'mi');
  const [hours, setHours] = useState(initialDuration.hours);
  const [minutes, setMinutes] = useState(initialDuration.minutes);
  const [seconds, setSeconds] = useState(initialDuration.seconds);
  const [runType, setRunType] = useState<RunType>(run?.runType ?? 'Easy Run');
  const [location, setLocation] = useState(run?.location ?? '');
  const [notes, setNotes] = useState(run?.notes ?? '');

  const durationSeconds = useMemo(
    () => parseWholeNumber(hours) * 3600 + parseWholeNumber(minutes) * 60 + parseWholeNumber(seconds),
    [hours, minutes, seconds]
  );

  const isDirty = useMemo(() => {
    if (!run) return false;
    return (
      title !== run.title ||
      date !== dateInputValue(run.date) ||
      distance !== String(run.distance) ||
      distanceUnit !== run.distanceUnit ||
      durationSeconds !== run.durationSeconds ||
      runType !== run.runType ||
      location !== (run.location ?? '') ||
      notes !== (run.notes ?? '')
    );
  }, [date, distance, distanceUnit, durationSeconds, location, notes, run, runType, title]);

  const handleCancel = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Discard changes?', 'Your edits to this run will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleSave = () => {
    if (!runId || !run) return;

    const parsedDistance = parseNumber(distance);
    const normalizedDate = normalizeDateInput(date);

    if (parsedDistance <= 0) {
      Alert.alert('Distance needed', 'Enter a distance greater than 0.');
      return;
    }

    if (durationSeconds <= 0) {
      Alert.alert('Duration needed', 'Enter a duration greater than 0.');
      return;
    }

    if (!normalizedDate) {
      Alert.alert('Date needed', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    updateRun(runId, {
      title: title.trim() || `${runType} Run`,
      date: normalizedDate,
      distance: parsedDistance,
      distanceUnit,
      durationSeconds,
      runType,
      location,
      notes,
    });

    router.replace({ pathname: '/run/[id]', params: { id: runId } });
  };

  if (!runId || !run) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.missingWrap}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={styles.missingTitle}>Run not found</Text>
          <Text style={styles.emptyText}>This run may have been deleted or is no longer available.</Text>
          <PrimaryButton
            label="Back to Runs"
            variant="outline"
            onPress={() => router.replace('/run/history')}
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
          <Pressable onPress={handleCancel} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Edit Run</Text>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard elevated tint="tech" style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Run title" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={`${runType} Run`}
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />

            <FieldLabel label="Date" style={{ marginTop: spacing.md }} />
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <FieldLabel label="Distance" style={{ marginTop: spacing.md }} />
            <View style={styles.distanceRow}>
              <TextInput
                value={distance}
                onChangeText={setDistance}
                style={[styles.input, styles.distanceInput]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <SegmentedControl
                value={distanceUnit}
                options={['mi', 'km']}
                onChange={(next) => setDistanceUnit(next as DistanceUnit)}
              />
            </View>

            <FieldLabel label="Duration" style={{ marginTop: spacing.md }} />
            <View style={styles.durationRow}>
              <DurationInput label="hr" value={hours} onChangeText={setHours} />
              <DurationInput label="min" value={minutes} onChangeText={setMinutes} />
              <DurationInput label="sec" value={seconds} onChangeText={setSeconds} />
            </View>
          </AppCard>

          <AppCard style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Run type" />
            <View style={styles.typeGrid}>
              {RUN_TYPES.map((type) => {
                const selected = type === runType;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setRunType(type)}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          <AppCard style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Location" />
            <TextInput
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />

            <FieldLabel label="Notes" style={{ marginTop: spacing.md }} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.notesInput]}
              placeholder="How did it feel?"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
          </AppCard>

          <PrimaryButton label="Save Run" variant="primary" onPress={handleSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return <Text style={[styles.label, style]}>{label}</Text>;
}

function DurationInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.durationInputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.durationInput}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Text style={styles.durationLabel}>{label}</Text>
    </View>
  );
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segmentedOption, selected && styles.segmentedOptionSelected]}
          >
            <Text style={[styles.segmentedText, selected && styles.segmentedTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
  closeButton: {
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
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
    color: colors.accentLime,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
  },
  distanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  distanceInput: {
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  durationInputWrap: {
    flex: 1,
  },
  durationInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  durationLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentedOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  segmentedOptionSelected: {
    backgroundColor: colors.accentTeal,
  },
  segmentedText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  segmentedTextSelected: {
    color: colors.background,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  typeChipSelected: {
    borderColor: colors.accentTeal,
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  typeChipTextSelected: {
    color: colors.accentTeal,
  },
  notesInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
