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
import PrimaryButton from '../../src/components/PrimaryButton';
import { useHybridSessions } from '../../src/context/HybridContext';
import {
  getHybridTemplateSegments,
  isHybridSessionType,
} from '../../src/data/hybridTemplates';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatSegmentTime } from '../../src/utils/hybridStats';
import type { HybridDistanceUnit, HybridSegmentType, HybridSessionType } from '../../src/types';

interface SegmentDraft {
  localId: string;
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
  return `draft_${Date.now()}_${_draftCounter}`;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: string): number {
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseWholeNumber(value: string): number {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getDraftDurationSeconds(segment: SegmentDraft): number {
  return parseWholeNumber(segment.minutes) * 60 + parseWholeNumber(segment.seconds);
}

function makeDraftSegment(
  name: string,
  segmentType: HybridSegmentType,
  distance = '',
  distanceUnit: HybridDistanceUnit = 'km'
): SegmentDraft {
  return {
    localId: makeDraftId(),
    name,
    segmentType,
    distance,
    distanceUnit,
    minutes: '',
    seconds: '',
    notes: '',
  };
}

function makeInitialSegments(sessionType: HybridSessionType): SegmentDraft[] {
  return getHybridTemplateSegments(sessionType).map((template) =>
    makeDraftSegment(
      template.name,
      template.segmentType,
      template.distance ? String(template.distance) : '',
      template.distanceUnit ?? 'km'
    )
  );
}

export default function ActiveHybridSessionScreen() {
  const params = useLocalSearchParams<{
    sessionType?: string;
    title?: string;
    date?: string;
    notes?: string;
  }>();
  const { addHybridSession } = useHybridSessions();

  const sessionTypeParam = firstParam(params.sessionType);
  const sessionType = isHybridSessionType(sessionTypeParam)
    ? sessionTypeParam
    : 'HYROX Race Sim';
  const title = firstParam(params.title)?.trim() || sessionType;
  const date = firstParam(params.date) || new Date().toISOString();
  const sessionNotes = firstParam(params.notes)?.trim() || undefined;
  const isCustom = sessionType === 'Custom Hybrid';

  const [segments, setSegments] = useState<SegmentDraft[]>(() => makeInitialSegments(sessionType));

  const totalSeconds = useMemo(
    () => segments.reduce((sum, segment) => sum + getDraftDurationSeconds(segment), 0),
    [segments]
  );
  const timedSegments = useMemo(
    () => segments.filter((segment) => getDraftDurationSeconds(segment) > 0).length,
    [segments]
  );

  const updateSegment = (localId: string, patch: Partial<SegmentDraft>) => {
    setSegments((current) =>
      current.map((segment) => (segment.localId === localId ? { ...segment, ...patch } : segment))
    );
  };

  const addSegment = (segmentType: HybridSegmentType) => {
    setSegments((current) => [
      ...current,
      makeDraftSegment(segmentType === 'run' ? 'Run' : 'Station', segmentType),
    ]);
  };

  const removeSegment = (localId: string) => {
    setSegments((current) =>
      current.length <= 1 ? current : current.filter((segment) => segment.localId !== localId)
    );
  };

  const handleCancel = () => {
    if (totalSeconds <= 0) {
      router.back();
      return;
    }

    Alert.alert('Cancel session?', 'Entered segment times will be discarded.', [
      { text: 'Keep Tracking', style: 'cancel' },
      { text: 'Cancel Session', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleFinish = () => {
    if (totalSeconds <= 0) {
      Alert.alert('Segment time needed', 'Enter time for at least one segment before saving.');
      return;
    }

    const session = addHybridSession({
      title,
      date,
      sessionType,
      notes: sessionNotes,
      segments: segments.map((segment) => {
        const distance = parseNumber(segment.distance);
        return {
          name: segment.name,
          segmentType: segment.segmentType,
          distance: distance > 0 ? distance : undefined,
          distanceUnit: distance > 0 ? segment.distanceUnit : undefined,
          durationSeconds: getDraftDurationSeconds(segment),
          notes: segment.notes,
        };
      }),
    });

    router.replace({ pathname: '/hybrid/[id]', params: { id: session.id } });
  };

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
          <View style={styles.timerWrap}>
            <Text style={styles.timer}>{formatSegmentTime(totalSeconds)}</Text>
            <Text style={styles.timerSub}>{timedSegments} timed</Text>
          </View>
          <Pressable onPress={handleFinish} hitSlop={8} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{sessionType} • Enter segment times manually.</Text>

          <View style={styles.summaryCard}>
            <SummaryMetric label="Total Time" value={formatSegmentTime(totalSeconds)} />
            <SummaryMetric label="Segments" value={String(segments.length)} />
            <SummaryMetric label="Completed" value={String(timedSegments)} />
          </View>

          <View style={styles.segmentList}>
            {segments.map((segment, index) => (
              <SegmentEditor
                key={segment.localId}
                segment={segment}
                order={index + 1}
                editableName={isCustom}
                removable={isCustom && segments.length > 1}
                onChange={(patch) => updateSegment(segment.localId, patch)}
                onRemove={() => removeSegment(segment.localId)}
              />
            ))}
          </View>

          {isCustom ? (
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
          ) : null}

          <PrimaryButton
            label="Finish Session"
            variant="primary"
            onPress={handleFinish}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SegmentEditor({
  segment,
  order,
  editableName,
  removable,
  onChange,
  onRemove,
}: {
  segment: SegmentDraft;
  order: number;
  editableName: boolean;
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
          {editableName ? (
            <TextInput
              value={segment.name}
              onChangeText={(name) => onChange({ name })}
              style={styles.nameInput}
              placeholder={isRun ? 'Run' : 'Station'}
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
          ) : (
            <Text style={styles.segmentName}>{segment.name}</Text>
          )}
          <Text style={styles.segmentType}>{isRun ? 'Run segment' : 'Station segment'}</Text>
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

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
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
  timerWrap: {
    alignItems: 'center',
  },
  timer: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  timerSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  finishButton: {
    minWidth: 64,
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  finishButtonText: {
    color: colors.accentLime,
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
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
  segmentList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  segmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198, 255, 0, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 0, 0.22)',
  },
  orderText: {
    color: colors.accentLime,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  segmentName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  segmentType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  removeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    padding: 0,
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
    textTransform: 'uppercase',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
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
  distanceInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  customActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  customAction: {
    flex: 1,
  },
});
