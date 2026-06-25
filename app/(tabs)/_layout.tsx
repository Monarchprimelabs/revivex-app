import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/theme';

/**
 * Bottom tab navigator.
 * Five tabs match the priority feature areas:
 *   Home → Train → Run → Hybrid → Progress
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 18);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentTeal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset + 6,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 3,
        },
        tabBarIconStyle: {
          marginBottom: -1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '700',
          letterSpacing: 0,
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: 'Run',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="walk-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="hybrid"
        options={{
          title: 'Hybrid',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
