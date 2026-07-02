import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from './AppCard';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme/theme';
import type { ActivityFeedItem, ActivityFeedType } from '../types';

interface ActivityFeedCardProps {
  item: ActivityFeedItem;
  onPress: () => void;
  compact?: boolean;
}

type IconName = keyof typeof Ionicons.glyphMap;

export default function ActivityFeedCard({
  item,
  onPress,
  compact = false,
}: ActivityFeedCardProps) {
  const accent = getAccent(item.type);

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <AppCard style={compact ? styles.compactCard : undefined}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
            <Ionicons name={getIconName(item.type)} size={22} color={accent.color} />
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.chip, { borderColor: accent.border }]}>
                <Text style={[styles.chipText, { color: accent.color }]} numberOfLines={1}>
                  {item.chipLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
            {!compact ? (
              <View style={styles.statRow}>
                {item.stats.slice(0, 3).map((stat) => (
                  <View key={stat.label} style={styles.stat}>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {stat.value}
                    </Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.side}>
            <Text style={styles.dateLabel}>{item.dateLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

function getIconName(type: ActivityFeedType): IconName {
  if (type === 'workout') return 'barbell-outline';
  if (type === 'run') return 'walk-outline';
  return 'flash-outline';
}

function getAccent(type: ActivityFeedType) {
  if (type === 'workout') {
    return {
      color: colors.accentLime,
      bg: 'rgba(198, 255, 0, 0.09)',
      border: 'rgba(198, 255, 0, 0.28)',
    };
  }

  if (type === 'run') {
    return {
      color: colors.accentTeal,
      bg: 'rgba(0, 180, 179, 0.12)',
      border: 'rgba(0, 180, 179, 0.30)',
    };
  }

  return {
    color: colors.primary,
    bg: 'rgba(0, 180, 179, 0.10)',
    border: 'rgba(198, 255, 0, 0.22)',
  };
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.md,
  },
  compactCard: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  chip: {
    maxWidth: 112,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(15, 17, 20, 0.28)',
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  stat: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
