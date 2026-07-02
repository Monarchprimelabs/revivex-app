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
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppCard from '../../../src/components/AppCard';
import PrimaryButton from '../../../src/components/PrimaryButton';
import { useHybridSessions } from '../../../src/context/HybridContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/theme/theme';
import { formatSegmentTime } from '../../../src/utils/hybridStats';
import type {
  HybridDistanceUnit,
  HybridSegment,
  HybridSegmentType,
  HybridSessionType,
} from '../../../src/types';

const SESSION_TYPES: HybridSessionType[] = [
  'HYROX Race Sim',
  'Hybrid Benchmark',
  'Conditioning Circuit',
  'Custom Hybrid',
  'Other',
];

interface SegmentDraft {
  id: string;
  name: string;
  segmentType: HybridSegmentType;
  distance: string;
  distanceUnit: HybridDistanceUnit;
  minutes: string;
  seconds: string;
  notes: string;
}

let _draftCounter = 0;
function makeDraftId() {
  _draftCounter += 1;
  return `hseg_edit_${Date.now()}_${_draftCounter}`;
}

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
    minutes: String(Math.floor(safe / 60)),
    seconds: String(safe % 60),
  };
}

function draftFromSegment(segment: HybridSegment): SegmentDraft {
  const duration = splitDuration(segment.durationSeconds);
  return {
    id: segment.id || makeDraftId(),
    name: segment.name,
    segmentType: segment.segmentType,
    distance: segment.distance === undefined ? '' : String(segment.distance),
    distanceUnit: segment.distanceUnit ?? 'km',
    minutes: duration.minutes,
    seconds: duration.seconds,
    notes: segment.notes ?? '',
  };
}

function makeBlankDraft(segmentType: HybridSegmentType): SegmentDraft {
  return {
    id: makeDraftId(),
    name: segmentType === 'run' ? 'Run' : 'Station',
    segmentType,
    distance: '',
    distanceUnit: 'km',
    minutes: '',
    seconds: '',
    notes: '',
  };
}

function getDraftDurationSeconds(segment: SegmentDraft): number {
  return parseWholeNumber(segment.minutes) * 60 + parseWholeNumber(segment.seconds);
}

export default function EditHybridSessionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const sessionId = firstParam(params.id);
  const { getHybridSessionById, updateHybridSession } = useHybridSessions();
  const session = sessionId ? getHybridSessionById(sessionId) : undefined;

  const [title, setTitle] = useState(session?.title ?? '');
  const [date, setDate] = useState(session ? dateInputValue(session.date) : '');
  const [sessionType, setSessionType] = useState<HybridSessionType>(
    session?.sessionType ?? 'Custom Hybrid'
  );
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [segments, setSegments] = useState<SegmentDraft[]>(
    () => session?.segments.map(draftFromSegment) ?? []
  );

  const totalSeconds = useMemo(
    () => segments.reduce((sum, segment) => sum + getDraftDurationSeconds(segment), 0),
    [segments]
  );
  const timedSegments = useMemo(
    () => segments.filter((segment) => getDraftDurationSeconds(segment) > 0).length,
    [segments]
  );

  const isDirty = useMemo(() => {
    if (!session) return false;
    return (
      title !== session.title ||
      date !== dateInputValue(session.date) ||
      sessionType !== session.sessionType ||
      notes !== (session.notes ?? '') ||
      JSON.stringify(segments) !== JSON.stringify(session.segments.map(draftFromSegment))
    );
  }, [date, notes, segments, session, sessionType, title]);

  const updateSegment = (segmentId: string, patch: Partial<SegmentDraft>) => {
    setSegments((current) =>
      current.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment))
    );
  };

  const removeSegment = (segmentId: string) => {
    setSegments((current) =>
      current.length <= 1 ? current : current.filter((segment) => segment.id !== segmentId)
    );
  };

  const addSegment = (segmentType: HybridSegmentType) => {
    setSegments((current) => [...current, makeBlankDraft(segmentType)]);
  };

  const handleCancel = () => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Discard changes?', 'Your edits to this hybrid session will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleSave = () => {
    if (!sessionId || !session) return;

    const normalizedDate = normalizeDateInput(date);
    if (!normalizedDate) {
      Alert.alert('Date needed', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    if (totalSeconds <= 0) {
      Alert.alert('Segment time needed', 'Enter time for at least one segment before saving.');
      return;
    }

    const updatedSegments: HybridSegment[] = segments.map((segment, index) => {
      const distance = parseNumber(segment.distance);
      return {
        id: segment.id,
        order: index + 1,
        name: segment.name.trim() || (segment.segmentType === 'run' ? 'Run' : 'Station'),
        segmentType: segment.segmentType,
        distance: segment.segmentType === 'run' && distance > 0 ? distance : undefined,
        distanceUnit:
          segment.segmentType === 'run' && distance > 0 ? segment.distanceUnit : undefined,
        durationSeconds: getDraftDurationSeconds(segment),
        notes: segment.notes.trim() || undefined,
      };
    });

    updateHybridSession(sessionId, {
      title: title.trim() || sessionType,
      date: normalizedDate,
      sessionType,
      notes,
      segments: updatedSegments,
    });

    router.replace({ pathname: '/hybrid/[id]', params: { id: sessionId } });
  };

  if (!sessionId || !session) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.missingWrap}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
          <Text style={styles.missingTitle}>Hybrid session not found</Text>
          <Text style={styles.emptyText}>
            This session may have been deleted or is no longer available.
          </Text>
          <PrimaryButton
            label="Back to Hybrid"
            variant="outline"
            onPress={() => router.replace('/hybrid/history')}
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
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Edit Hybrid</Text>
            <Text style={styles.topSub}>{formatSegmentTime(totalSeconds)} total</Text>
          </View>
          <Pressable onPress={handleSave} hitSlop={8} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard elevated tint="hybrid" style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Title" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder={sessionType}
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

            <FieldLabel label="Session type" style={{ marginTop: spacing.md }} />
            <View style={styles.typeGrid}>
              {SESSION_TYPES.map((type) => {
                const selected = type === sessionType;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSessionType(type)}
                    style={[styles.typeChip, selected && styles.typeChipSelected]}
                  >
                    <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <FieldLabel label="Notes" style={{ marginTop: spacing.md }} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.notesInput]}
              placeholder="Session notes optional"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
          </AppCard>

          <View style={styles.summaryCard}>
            <SummaryMetric label="Total Time" value={formatSegmentTime(totalSeconds)} />
            <SummaryMetric label="Segments" value={String(segments.length)} />
            <SummaryMetric label="Timed" value={String(timedSegments)} />
          </View>

          {segments.map((segment, index) => (
            <SegmentEditor
              key={segment.id}
              segment={segment}
              order={index + 1}
              removable={segments.length > 1}
              onChange={(patch) => updateSegment(segment.id, patch)}
              onRemove={() => removeSegment(segment.id)}
            />
          ))}

          <View style={styles.customActions}>
            <PrimaryButton
              label="+ Add Run"
              variant="outline"
              onPress={() => addSegment('run')}
              style={styles.customAction}
            />
            <PrimaryButton
              label="+ Add Station"
              variant="outline"
              onPress={() => addSegment('station')}
              style={styles.customAction}
            />
          </View>

          <PrimaryButton
            label="Save Hybrid Session"
            variant="primary"
            onPress={handleSave}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return <Text style={[styles.label, style]}>{label}</Text>;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SegmentEditor({
  segment,
  order,
  removable,
  onChange,
  onRemove,
}: {
  segment: SegmentDraft;
  order: number;
  removable: boolean;
  onChange: (patch: Partial<SegmentDraft>) => void;
  onRemove: () => void;
}) {
  const isRun = segment.segmentType === 'run';

  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={segment.name}
            onChangeText={(name) => onChange({ name })}
            style={styles.segmentNameInput}
            placeholder={isRun ? 'Run' : 'Station'}
            placeholderTextColor={colors.textMuted}
            maxLength={60}
          />
          <SegmentedControl
            value={segment.segmentType}
            options={['run', 'station']}
            onChange={(segmentType) => onChange({ segmentType: segmentType as HybridSegmentType })}
          />
        </View>
        {removable ? (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.inputRow}>
        <DurationInput
          label="min"
          value={segment.minutes}
          onChangeText={(minutes) => onChange({ minutes })}
        />
        <DurationInput
          label="sec"
          value={segment.seconds}
          onChangeText={(seconds) => onChange({ seconds })}
        />
      </View>

      {isRun ? (
        <View style={styles.distanceRow}>
          <TextInput
            value={segment.distance}
            onChangeText={(distance) => onChange({ distance })}
            style={[styles.input, styles.distanceInput]}
            placeholder="Distance"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <SegmentedControl
            value={segment.distanceUnit}
            options={['mi', 'km', 'm']}
            onChange={(distanceUnit) =>
              onChange({ distanceUnit: distanceUnit as HybridDistanceUnit })
            }
          />
        </View>
      ) : null}

      <TextInput
        value={segment.notes}
        onChangeText={(notes) => onChange({ notes })}
        style={[styles.input, styles.notesInput]}
        placeholder="Segment notes optional"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={240}
      />
    </View>
  );
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
    <View style={styles.durationWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.durationInput}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={3}
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
  topCenter: {
    alignItems: 'center',
  },
  topTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  topSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
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
  notesInput: {
    minHeight: 92,
    textAlignVertical: 'top',
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
    borderColor: colors.accentLime,
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  typeChipTextSelected: {
    color: colors.accentLime,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryMetric: {
    flex: 1,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  segmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 180, 179, 0.12)',
  },
  orderText: {
    color: colors.accentTeal,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  segmentNameInput: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    padding: 0,
    marginBottom: spacing.sm,
  },
  removeButton: {
    padding: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  durationWrap: {
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
  distanceRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  distanceInput: {
    flex: 1,
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
    paddingVertical: spacing.sm,
  },
  segmentedOptionSelected: {
    backgroundColor: colors.accentTeal,
  },
  segmentedText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  segmentedTextSelected: {
    color: colors.background,
  },
  customActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  customAction: {
    flex: 1,
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
