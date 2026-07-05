import type { PreferredWeightUnit } from '../types';

/**
 * Barbell plate math. Pure and Node-testable.
 * All weights are in the same unit (lb or kg) — no conversion here.
 */

export const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export const LB_BARS = [45, 35, 15];
export const KG_BARS = [20, 15, 10];

export function platesForUnit(unit: PreferredWeightUnit): number[] {
  return unit === 'kg' ? KG_PLATES : LB_PLATES;
}

export function barsForUnit(unit: PreferredWeightUnit): number[] {
  return unit === 'kg' ? KG_BARS : LB_BARS;
}

export function defaultBarForUnit(unit: PreferredWeightUnit): number {
  return unit === 'kg' ? 20 : 45;
}

export interface PlateCount {
  plate: number;
  count: number;
}

export interface PlateBreakdown {
  barWeight: number;
  /** Plates loaded on ONE side, heaviest first. */
  perSide: PlateCount[];
  /** Closest loadable weight (bar + both sides) not exceeding the target. */
  achievedWeight: number;
  /** Target minus achieved; > 0 when plates can't hit the target exactly. */
  remainder: number;
  /** True when the target is below the bar itself. */
  belowBar: boolean;
}

export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  availablePlates: number[]
): PlateBreakdown {
  const target = Number.isFinite(targetWeight) ? Math.max(0, targetWeight) : 0;
  const bar = Number.isFinite(barWeight) ? Math.max(0, barWeight) : 0;

  if (target <= bar) {
    return {
      barWeight: bar,
      perSide: [],
      achievedWeight: bar,
      remainder: 0,
      belowBar: target < bar,
    };
  }

  const plates = [...availablePlates].sort((a, b) => b - a);
  let perSideRemaining = (target - bar) / 2;
  const perSide: PlateCount[] = [];

  for (const plate of plates) {
    if (plate <= 0) continue;
    const count = Math.floor((perSideRemaining + 1e-9) / plate);
    if (count > 0) {
      perSide.push({ plate, count });
      perSideRemaining -= count * plate;
    }
  }

  const perSideLoaded = perSide.reduce((sum, item) => sum + item.plate * item.count, 0);
  const achievedWeight = bar + perSideLoaded * 2;

  return {
    barWeight: bar,
    perSide,
    achievedWeight,
    remainder: Math.round((target - achievedWeight) * 100) / 100,
    belowBar: false,
  };
}
