import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../src/components/ScreenContainer';
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { HYBRID_SESSION_TYPES, isHybridSessionType } from '../../src/data/hybridTemplates';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import type { HybridSessionType } from '../../src/types';

function todayDateInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export default function StartHybridSessionScreen() {
  const { sessionType: initialSessionType } = useLocalSearchParams<{ sessionType?: string }>();
  const initialType = isHybridSessionType(initialSessionType)
    ? initialSessionType
    : 'HYROX Race Sim';

  const [sessionType, setSessionType] = useState<HybridSessionType>(initialType);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayDateInput());
  const [notes, setNotes] = useState('');

  const templateHint = useMemo(() => {
    if (sessionType === 'HYROX Race Sim') return '16 run/station segments';
    if (sessionType === 'Hybrid Benchmark') return '6 benchmark segments';
    return 'Start with a run and station, then add more inside the session.';
  }, [sessionType]);

  const handleStart = () => {
    const normalizedDate = normalizeDateInput(date);
    if (!normalizedDate) {
      Alert.alert('Date needed', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    router.push({
      pathname: '/hybrid/active',
      params: {
        sessionType,
        title: title.trim(),
        date: normalizedDate,
        notes: notes.trim(),
      },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Start Hybrid Session</Text>
          <Text style={styles.subtitle}>Pick a template, then log each segment time.</Text>
        </View>
      </View>

      <AppCard elevated tint="hybrid" style={{ marginTop: spacing.lg }}>
        <Text style={styles.cardLabel}>Session type</Text>
        <View style={styles.typeGrid}>
          {HYBRID_SESSION_TYPES.map((type) => {
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
        <Text style={styles.templateHint}>{templateHint}</Text>
      </AppCard>

      <AppCard style={{ marginTop: spacing.md }}>
        <FieldLabel label="Session title" />
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

        <FieldLabel label="Notes" style={{ marginTop: spacing.md }} />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notesInput]}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
      </AppCard>

      <PrimaryButton
        label="Start Session"
        variant="primary"
        onPress={handleStart}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

function FieldLabel({ label, style }: { label: string; style?: object }) {
  return <Text style={[styles.label, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
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
  cardLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.md,
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
  templateHint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.md,
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
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
