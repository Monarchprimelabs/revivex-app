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
import { router } from 'expo-router';
import PrimaryButton from '../../src/components/PrimaryButton';
import { useRuns } from '../../src/context/RunContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import type { DistanceUnit, RunType } from '../../src/types';

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

function todayDateInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseNumber(value: string): number {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseWholeNumber(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizeDateInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function ManualRunLogScreen() {
  const { addRun } = useRuns();
  const { profile } = useProfile();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayDateInput());
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(
    profile?.preferredDistanceUnit ?? 'mi'
  );
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [runType, setRunType] = useState<RunType>('Easy Run');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const durationSeconds = useMemo(() => {
    return parseWholeNumber(hours) * 3600 + parseWholeNumber(minutes) * 60 + parseWholeNumber(seconds);
  }, [hours, minutes, seconds]);

  const handleSave = () => {
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

    addRun({
      title,
      date: normalizedDate,
      distance: parsedDistance,
      distanceUnit,
      durationSeconds,
      runType,
      location,
      notes,
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Log Run</Text>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Manual Run</Text>
          <Text style={styles.subtitle}>Log distance, duration, pace, and notes.</Text>

          <View style={styles.card}>
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
          </View>

          <View style={styles.card}>
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
          </View>

          <View style={styles.card}>
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
          </View>

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
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
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
    minWidth: 64,
    paddingVertical: spacing.xs,
  },
  topTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  saveButton: {
    minWidth: 64,
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  saveButtonText: {
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
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
  distanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  distanceInput: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  segment: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  segmentSelected: {
    backgroundColor: colors.accentTeal,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  segmentTextSelected: {
    color: colors.background,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  durationInputWrap: {
    flex: 1,
  },
  durationInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  durationLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    backgroundColor: 'rgba(0, 180, 179, 0.14)',
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  typeChipTextSelected: {
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
