import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme/theme';

/**
 * Tint controls the subtle colored gradient overlay on elevated cards.
 *  - 'none'      → no tint, just the elevated dark surface
 *  - 'strength'  → faint teal-to-lime cue for main training heroes
 *  - 'tech'      → faint teal cue for run/analytics heroes
 *  - 'hybrid'    → teal + lime crossover, the ReviveX signature
 */
export type CardTint = 'none' | 'strength' | 'tech' | 'hybrid';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * When true, uses the elevated surface color + a stronger shadow,
   * and renders a subtle radial gradient overlay based on `tint`.
   * Use sparingly — best for hero cards at the top of a screen.
   */
  elevated?: boolean;
  /**
   * Only applies when `elevated` is true. Defaults to 'strength'.
   */
  tint?: CardTint;
}

/**
 * AppCard
 * A premium rounded container used for grouping related content.
 *
 * Standard variant: flat dark surface with a 1px border and soft shadow.
 * Elevated variant: lifted surface with deeper shadow, plus an optional
 * tinted gradient overlay in one or two corners for hero moments.
 */
export default function AppCard({
  children,
  style,
  elevated = false,
  tint = 'strength',
}: AppCardProps) {
  // Non-elevated: stay simple, no gradient overhead.
  if (!elevated) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  return (
    <View style={[styles.card, styles.elevated, style]}>
      {/* Tint overlay sits behind the children but inside the card.
          It's absolutely positioned so it never affects layout. */}
      {tint !== 'none' ? <TintOverlay tint={tint} /> : null}
      <View style={styles.elevatedContent}>{children}</View>
    </View>
  );
}

/**
 * Draws one or two soft colored gradients in the card corners.
 * We use two stacked LinearGradients to approximate radial corner glows
 * (since LinearGradient is the only one available in expo-linear-gradient).
 */
function TintOverlay({ tint }: { tint: Exclude<CardTint, 'none'> }) {
  if (tint === 'hybrid') {
    return (
      <>
        {/* Lime from top-right */}
        <LinearGradient
          colors={['rgba(198, 255, 0, 0.08)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.2, y: 0.7 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Teal from bottom-left */}
        <LinearGradient
          colors={['rgba(0, 180, 179, 0.10)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0.8, y: 0.3 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </>
    );
  }

  if (tint === 'tech') {
    return (
      <LinearGradient
        colors={['rgba(0, 180, 179, 0.10)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.7 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    );
  }

  // 'strength' (default)
  return (
    <LinearGradient
      colors={['rgba(198, 255, 0, 0.06)', 'rgba(0, 180, 179, 0.07)', 'transparent']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.2, y: 0.7 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden', // clip the gradient to the rounded corners
  },
  // When elevated, the content sits above the tint overlay.
  elevatedContent: {
    position: 'relative',
    zIndex: 1,
  },
});
