import { projectRoute } from '../src/utils/routeProjection';
import { check, checkTrue, suite } from './helpers';

export function runRouteProjectionTests(): void {
  suite('routeProjection');

  // Fewer than 2 valid points → undefined.
  check('single point undefined', projectRoute([{ lat: 40, lng: -74, t: 0 }], 100, 100), undefined);

  const square = [
    { lat: 40.0, lng: -74.0, t: 0 },
    { lat: 40.01, lng: -74.0, t: 1 },
    { lat: 40.01, lng: -73.99, t: 2 },
    { lat: 40.0, lng: -73.99, t: 3 },
  ];
  const projected = projectRoute(square, 200, 200, 12)!;
  const coords = projected.svgPoints.split(' ').map((pair) => pair.split(',').map(Number));

  checkTrue(
    'all points inside padded canvas',
    coords.every(([x, y]) => x >= 12 && x <= 188 && y >= 12 && y <= 188)
  );
  check('4 points projected', coords.length, 4);

  // North (higher lat) must map to smaller y than south.
  const [, northY] = coords[1];
  const [, southY] = coords[0];
  checkTrue('north is up', northY < southY);

  // Start/end match first/last projected coordinates.
  check('start matches', [projected.start.x, projected.start.y], coords[0]);
  check('end matches', [projected.end.x, projected.end.y], coords[3]);
}
