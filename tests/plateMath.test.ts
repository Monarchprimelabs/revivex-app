import { calculatePlates, KG_PLATES, LB_PLATES } from '../src/utils/plateMath';
import { check, suite } from './helpers';

export function runPlateMathTests(): void {
  suite('plateMath');

  // 225 lb on a 45 lb bar = 2×45 per side.
  const lb225 = calculatePlates(225, 45, LB_PLATES);
  check('225lb perSide', lb225.perSide, [{ plate: 45, count: 2 }]);
  check('225lb achieved', lb225.achievedWeight, 225);
  check('225lb remainder', lb225.remainder, 0);

  // 100 kg on a 20 kg bar = 40 per side → greedy 25 + 15.
  const kg100 = calculatePlates(100, 20, KG_PLATES);
  check('100kg perSide', kg100.perSide, [
    { plate: 25, count: 1 },
    { plate: 15, count: 1 },
  ]);
  check('100kg achieved', kg100.achievedWeight, 100);

  // Unreachable target leaves a remainder, never exceeds the target.
  const odd = calculatePlates(102, 45, LB_PLATES);
  check('odd target does not exceed', odd.achievedWeight <= 102, true);
  check('odd remainder positive', odd.remainder > 0, true);

  // Below the bar: no plates, flagged.
  const below = calculatePlates(30, 45, LB_PLATES);
  check('below bar flag', below.belowBar, true);
  check('below bar perSide empty', below.perSide, []);

  // Exactly the bar: not "below", no plates.
  const exact = calculatePlates(45, 45, LB_PLATES);
  check('exact bar not below', exact.belowBar, false);
  check('exact bar achieved', exact.achievedWeight, 45);

  // Garbage input is clamped instead of crashing.
  const nan = calculatePlates(Number.NaN, 45, LB_PLATES);
  check('NaN target treated as 0', nan.achievedWeight, 45);
}
