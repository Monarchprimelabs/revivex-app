import {
  HYROX_STATIONS,
  HYROX_TOTAL_RUN_METERS,
  formatRaceClock,
  hyroxRacePlan,
} from '../src/data/hyrox';
import { check, checkTrue, suite } from './helpers';

export function runHyroxTests(): void {
  suite('hyrox');

  check('8 stations', HYROX_STATIONS.length, 8);
  check('station order 1..8', HYROX_STATIONS.map((s) => s.index), [1, 2, 3, 4, 5, 6, 7, 8]);

  const plan = hyroxRacePlan('openMen');
  check('16 segments', plan.length, 16);
  checkTrue('alternates run/station', plan.every((seg, i) =>
    i % 2 === 0 ? seg.segmentType === 'run' : seg.segmentType === 'station'
  ));
  check('positions sequential', plan.map((s) => s.position), Array.from({ length: 16 }, (_, i) => i));

  const runMeters = plan
    .filter((seg) => seg.segmentType === 'run')
    .reduce((sum, seg) => sum + (seg.distanceMeters ?? 0), 0);
  check('total run distance 8km', runMeters, HYROX_TOTAL_RUN_METERS);

  // Division affects station loads, not structure.
  const pro = hyroxRacePlan('proMen');
  check('pro same structure', pro.map((s) => s.name), plan.map((s) => s.name));
  const openSled = plan.find((s) => s.name === 'Sled Push')!;
  const proSled = pro.find((s) => s.name === 'Sled Push')!;
  checkTrue('pro sled heavier string differs', openSled.load !== proSled.load);

  // Race clock formatting.
  check('clock 59s', formatRaceClock(59), '0:59');
  check('clock 61s', formatRaceClock(61), '1:01');
  check('clock 1h5m9s', formatRaceClock(3909), '1:05:09');
  check('clock clamps negative', formatRaceClock(-5), '0:00');
}
