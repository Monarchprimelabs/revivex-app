import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AppCard,
  BrandTagline,
  PrimaryButton,
  ScreenContainer,
  SectionHeader,
  colors,
} from '@revivex/design-system';

/**
 * Today screen scaffold for Direction B (daily coach).
 * The readiness check-in, plan generation and completion flow are built in the
 * vertical-slice step after the architecture is approved.
 */
export default function TodayScreen() {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.brand}>ReviveX</Text>
        <BrandTagline />
      </View>
      <SectionHeader title="Today" />
      <AppCard elevated>
        <Text style={styles.title}>Your session for today will appear here</Text>
        <Text style={styles.body}>
          Check in with how you slept and how sore you are, and the coach builds one session for the day from
          your training history.
        </Text>
        <PrimaryButton label="Check in" disabled />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});
