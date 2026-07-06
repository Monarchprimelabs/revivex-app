import type { RoutePoint } from '../types';

/**
 * Project GPS route points onto a flat canvas for SVG rendering.
 * Equirectangular projection with latitude correction — plenty accurate
 * for run-sized areas. Pure and Node-testable.
 */

export interface ProjectedRoute {
  /** "x,y x,y ..." ready for an SVG <Polyline points> attribute. */
  svgPoints: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function projectRoute(
  points: RoutePoint[],
  width: number,
  height: number,
  padding = 12
): ProjectedRoute | undefined {
  const valid = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)
  );
  if (valid.length < 2) return undefined;

  const midLatRad =
    (valid.reduce((sum, point) => sum + point.lat, 0) / valid.length) * (Math.PI / 180);
  const lngScale = Math.cos(midLatRad);

  // Flat coordinates (y flipped so north is up).
  const flat = valid.map((point) => ({ x: point.lng * lngScale, y: -point.lat }));

  const minX = Math.min(...flat.map((p) => p.x));
  const maxX = Math.max(...flat.map((p) => p.x));
  const minY = Math.min(...flat.map((p) => p.y));
  const maxY = Math.max(...flat.map((p) => p.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const drawW = width - padding * 2;
  const drawH = height - padding * 2;
  // Uniform scale preserves the route's shape; guard degenerate spans.
  const scale = Math.min(
    drawW / Math.max(spanX, 1e-9),
    drawH / Math.max(spanY, 1e-9)
  );

  // Center the scaled route in the canvas.
  const offsetX = padding + (drawW - spanX * scale) / 2;
  const offsetY = padding + (drawH - spanY * scale) / 2;

  const mapped = flat.map((p) => ({
    x: Math.round((offsetX + (p.x - minX) * scale) * 10) / 10,
    y: Math.round((offsetY + (p.y - minY) * scale) * 10) / 10,
  }));

  return {
    svgPoints: mapped.map((p) => `${p.x},${p.y}`).join(' '),
    start: mapped[0],
    end: mapped[mapped.length - 1],
  };
}
