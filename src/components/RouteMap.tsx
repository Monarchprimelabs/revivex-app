import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors, radius } from '../theme/theme';
import { projectRoute } from '../utils/routeProjection';
import type { RoutePoint } from '../types';

/**
 * Dark-theme route trace for GPS runs: teal polyline with a lime start
 * dot and white finish dot. Renders nothing when there's no usable route.
 */
export default function RouteMap({
  routePoints,
  height = 180,
}: {
  routePoints?: RoutePoint[];
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  const projected = useMemo(
    () => (routePoints && width > 0 ? projectRoute(routePoints, width, height) : undefined),
    [routePoints, width, height]
  );

  if (!routePoints || routePoints.length < 2) return null;

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
    >
      {projected ? (
        <Svg width={width} height={height}>
          <Polyline
            points={projected.svgPoints}
            fill="none"
            stroke={colors.accentTeal}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Circle
            cx={projected.start.x}
            cy={projected.start.y}
            r={5}
            fill={colors.accentLime}
          />
          <Circle cx={projected.end.x} cy={projected.end.y} r={5} fill={colors.textPrimary} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
