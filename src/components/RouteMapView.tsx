import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/theme';
import RouteMap from './RouteMap';
import type { RoutePoint } from '../types';

/**
 * Strava-style route map (Phase 41).
 *
 * On iOS dev/production builds this renders a real Apple Maps view with the
 * run's route drawn on it. react-native-maps is a native module, so it can't
 * load in Expo Go — and Android needs a Google Maps API key we haven't set —
 * in both cases this falls back to the dark SVG route trace.
 */

type MapsModule = typeof import('react-native-maps');

let cachedMaps: MapsModule | null | undefined;

function loadMaps(): MapsModule | null {
  if (cachedMaps !== undefined) return cachedMaps;
  if (Platform.OS !== 'ios') {
    // Android real maps need a Google Maps key (app.json android.config).
    cachedMaps = null;
    return cachedMaps;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedMaps = require('react-native-maps') as MapsModule;
  } catch {
    cachedMaps = null; // Expo Go
  }
  return cachedMaps;
}

function regionFor(points: RoutePoint[]) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.004),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.004),
  };
}

export default function RouteMapView({
  routePoints,
  height = 180,
}: {
  routePoints?: RoutePoint[];
  height?: number;
}) {
  const maps = useMemo(() => loadMaps(), []);

  if (!routePoints || routePoints.length < 2) return null;

  if (!maps) {
    return <RouteMap routePoints={routePoints} height={height} />;
  }

  const MapView = maps.default;
  const { Polyline, Marker } = maps;
  const coordinates = routePoints.map((point) => ({
    latitude: point.lat,
    longitude: point.lng,
  }));

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(routePoints)}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsPointsOfInterest={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={colors.accentTeal}
          strokeWidth={4}
        />
        <Marker coordinate={coordinates[0]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.dot, { backgroundColor: colors.accentLime }]} />
        </Marker>
        <Marker
          coordinate={coordinates[coordinates.length - 1]}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[styles.dot, { backgroundColor: colors.textPrimary }]} />
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
});
