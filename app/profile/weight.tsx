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
import AppCard from '../../src/components/AppCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import SectionHeader from '../../src/components/SectionHeader';
import { useBodyWeight, type BodyWeightEntry } from '../../src/context/BodyWeightContext';
import { useProfile } from '../../src/context/ProfileContext';
import { colors, fontSize, fontWeight, radius, spacing } from '../../src/theme/theme';
import { formatRelativeDate } from '../../src/utils/format';

const CHART_LIMIT = 14;

export default function BodyWeightScreen() {
  const { entries, entriesLoaded, addEntry, deleteEntry } = useBodyWeight();
  const { profile } = useProfile();
  const unit = profile?.preferredWeightUnit ?? 'lb';
  const [weightStr, setWeightStr] = useState('');

  const latest = entries[0];
  const previous = entries[1];
  const change =
    latest && previous ? Math.round((latest.weight - previous.weight) * 10) / 10 : undefined;

  // Oldest -> newest for the trend chart.
  const chartEntries = useMemo(
    () => [...entries].reverse().slice(-CHART_LIMIT),
    [entries]
  );
  const chartMin = Math.min(...chartEntries.map((entry) => entry.weight), Infinity);
  const chartMax = Math.max(...chartEntries.map((entry) => entry.weight), 0);

  const handleLog = () => {
    const weight = Number.parseFloat(weightStr.replace(',', '.'));
    if (!Number.isFinite(weight) || weight <= 0) {
      Alert.alert('Weight needed', `Enter your current weight in ${unit}.`);
      return;
    }
    addEntry(weight, unit);
    setWeightStr('');
  };

  const handleDelete = (entry: BodyWeightEntry) => {
    Alert.alert('Delete entry?', 'This weight entry will be removed from your log.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Body Weight</Text>
          <View style={styles.topBarBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard elevated tint="hybrid">
            <Text style={styles.label}>Log today's weight ({unit})</Text>
            <View style={styles.logRow}>
              <TextInput
                value={weightStr}
                onChangeText={setWeightStr}
                style={styles.weightInput}
                placeholder="0.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleLog}
              />
              <PrimaryButton label="Log" variant="primary" onPress={handleLog} />
            </View>
          </AppCard>

          {!entriesLoaded ? (
            <AppCard style={{ marginTop: spacing.md }}>
              <Text style={styles.hint}>Loading weight log...</Text>
            </AppCard>
          ) : entries.length === 0 ? (
            <AppCard style={{ marginTop: spacing.md }}>
              <Text style={styles.hint}>
                Log your weight regularly to see your trend here. Entries stay private on
                this device.
              </Text>
            </AppCard>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <SummaryMetric
                  label="Current"
                  value={`${latest.weight} ${latest.unit}`}
                />
                <SummaryMetric
                  label="Change"
                  value={
                    change === undefined
                      ? '—'
                      : `${change > 0 ? '+' : ''}${change} ${latest.unit}`
                  }
                />
                <SummaryMetric label="Entries" value={String(entries.length)} />
              </View>

              {chartEntries.length >= 2 ? (
                <>
                  <SectionHeader title="Trend" />
                  <AppCard>
                    <View style={styles.chartRow}>
                      {chartEntries.map((entry) => {
                        const span = Math.max(chartMax - chartMin, 0.1);
                        const ratio = (entry.weight - chartMin) / span;
                        const barHeight = 18 + Math.round(ratio * 70);
                        return (
                          <View key={entry.id} style={styles.chartBarWrap}>
                            <View style={[styles.chartFill, { height: barHeight }]} />
                          </View>
                        );
                      })}
                    </View>
                    <View style={styles.chartFooter}>
                      <Text style={styles.chartFooterText}>
                        {formatRelativeDate(chartEntries[0].date)}
                      </Text>
                      <Text style={styles.chartFooterText}>
                        {chartMin} – {chartMax} {unit}
                      </Text>
                      <Text style={styles.chartFooterText}>
                        {formatRelativeDate(chartEntries[chartEntries.length - 1].date)}
                      </Text>
                    </View>
                  </AppCard>
                </>
              ) : null}

              <SectionHeader title="History" />
              <AppCard style={{ marginBottom: spacing.lg }}>
                {entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[styles.entryRow, index !== entries.length - 1 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryWeight}>
                        {entry.weight} {entry.unit}
                      </Text>
                      <Text style={styles.entryDate}>{formatRelativeDate(entry.date)}</Text>
                    </View>
                    <Pressable onPress={() => handleDelete(entry)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </AppCard>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
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
  topBarBtn: {
    width: 44,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
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
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    height: 96,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartFill: {
    width: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTeal,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  chartFooterText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  entryWeight: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  entryDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
