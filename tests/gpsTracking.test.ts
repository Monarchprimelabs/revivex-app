import {
  advanceTrack,
  compressRoute,
  createTrackState,
  finalizeSplits,
  haversineMeters,
  metersToDistance,
} from '../src/utils/gpsTracking';
import { check, checkClose, suite } from './helpers';

export function runGpsTests(): void {
  suite('gpsTracking');

  // Known distance: 0.01° latitude ≈ 1111.9 m.
  const d = haversineMeters({ lat: 40.0, lng: -74.0 }, { lat: 40.01, lng: -74.0 });
  checkClose('haversine 0.01 deg lat', d, 1111.9, 2);

  // Simulated straight-line run north: 60 fixes, 20 m every 5 s (4 m/s).
  let state = createTrackState();
  const degPerMeterLat = 1 / 111_194;
  for (let i = 0; i < 60; i += 1) {
    state = advanceTrack(
      state,
      { lat: 40 + i * 20 * degPerMeterLat, lng: -74, t: 1_000_000 + i * 5000, accuracy: 5 },
      'km'
    );
  }
  checkClose('sim distance ~1180m', state.distanceMeters, 59 * 20, 6);
  check('sim completes 1 km lap', state.splits.length, 1);

  // Poor-accuracy fix is dropped entirely.
  const before = state.distanceMeters;
  state = advanceTrack(
    state,
    { lat: 41, lng: -74, t: 2_000_000, accuracy: 80 },
    'km'
  );
  check('bad accuracy ignored', state.distanceMeters, before);

  // Teleport (>12.5 m/s) adds no distance but re-anchors.
  const anchored = advanceTrack(
    state,
    { lat: 40.5, lng: -74, t: state.lastFix!.t + 1000, accuracy: 5 },
    'km'
  );
  check('teleport adds no distance', anchored.distanceMeters, state.distanceMeters);
  check('teleport re-anchors', anchored.lastFix!.lat, 40.5);

  // Finalize adds the partial lap.
  const splits = finalizeSplits(state, state.lastFix!.t + 1000, 'km');
  check('finalize adds partial lap', splits.length, state.splits.length + 1);

  // Unit conversion sanity.
  checkClose('1609m in miles', metersToDistance(1609.344, 'mi'), 1, 0.001);

  // Route compression caps points and keeps endpoints.
  const long = Array.from({ length: 2000 }, (_, i) => ({ lat: i, lng: i, t: i }));
  const compressed = compressRoute(long, 600);
  check('compress caps at 600', compressed.length <= 600, true);
  check('compress keeps start', compressed[0].lat, 0);
  check('compress keeps end', compressed[compressed.length - 1].lat, 1999);
}
