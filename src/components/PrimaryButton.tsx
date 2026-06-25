import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, fontWeight, gradients, radius, spacing } from '../theme/theme';

type Variant = 'primary' | 'accent' | 'tech' | 'outline';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * PrimaryButton
 * The standard button across the app.
 * Variants:
 *  - primary  → ReviveX teal-to-lime gradient for main CTAs
 *  - accent   → dark lime-accent CTA for secondary energy actions
 *  - tech     → teal analytics / run CTA
 *  - outline  → transparent with border for secondary actions
 */
export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isAccent = variant === 'accent';
  const isGradient = variant === 'primary';
  const bg = variant === 'tech' ? colors.accentTeal : isAccent ? colors.surfaceAlt : 'transparent';
  const textColor =
    isOutline ? colors.textPrimary : isAccent ? colors.accentLime : colors.background;
  const borderColor = isOutline ? colors.border : isAccent ? colors.accentLime : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isGradient ? 'transparent' : bg,
          borderColor,
          borderWidth: isOutline || isAccent ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        // Light shadow on filled variants for premium lift.
        !isOutline && !isAccent && styles.shadow,
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradients.cta}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
