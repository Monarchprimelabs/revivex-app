/**
 * HYROX race format data (Phase 49).
 *
 * The race is fixed worldwide: 8 × 1 km runs, each followed by one of 8
 * functional stations, always in the same order. Station loads below are
 * the widely published standards per division; individual events can vary
 * slightly by season, so the player treats them as targets, not rules.
 */

export type HyroxDivision = 'openMen' | 'openWomen' | 'proMen' | 'proWomen';

export const HYROX_DIVISIONS: { id: HyroxDivision; label: string }[] = [
  { id: 'openMen', label: "Open · Men" },
  { id: 'openWomen', label: "Open · Women" },
  { id: 'proMen', label: "Pro · Men" },
  { id: 'proWomen', label: "Pro · Women" },
];

export interface HyroxStation {
  /** Station order, 1-8. */
  index: number;
  name: string;
  /** e.g. "1,000 m" or "100 reps" */
  metric: string;
  /** Distance in meters when the station is distance-based. */
  distanceMeters?: number;
  /** Target load per division, human-readable. */
  loads: Record<HyroxDivision, string>;
  /** MaterialCommunityIcons name. */
  icon: string;
}

export const HYROX_STATIONS: HyroxStation[] = [
  {
    index: 1,
    name: 'SkiErg',
    metric: '1,000 m',
    distanceMeters: 1000,
    loads: { openMen: '—', openWomen: '—', proMen: '—', proWomen: '—' },
    icon: 'ski',
  },
  {
    index: 2,
    name: 'Sled Push',
    metric: '50 m',
    distanceMeters: 50,
    loads: {
      openMen: '152 kg total',
      openWomen: '102 kg total',
      proMen: '202 kg total',
      proWomen: '152 kg total',
    },
    icon: 'dumbbell',
  },
  {
    index: 3,
    name: 'Sled Pull',
    metric: '50 m',
    distanceMeters: 50,
    loads: {
      openMen: '103 kg total',
      openWomen: '78 kg total',
      proMen: '153 kg total',
      proWomen: '103 kg total',
    },
    icon: 'anchor',
  },
  {
    index: 4,
    name: 'Burpee Broad Jump',
    metric: '80 m',
    distanceMeters: 80,
    loads: { openMen: 'Bodyweight', openWomen: 'Bodyweight', proMen: 'Bodyweight', proWomen: 'Bodyweight' },
    icon: 'human-handsdown',
  },
  {
    index: 5,
    name: 'Row',
    metric: '1,000 m',
    distanceMeters: 1000,
    loads: { openMen: '—', openWomen: '—', proMen: '—', proWomen: '—' },
    icon: 'rowing',
  },
  {
    index: 6,
    name: "Farmer's Carry",
    metric: '200 m',
    distanceMeters: 200,
    loads: {
      openMen: '2 × 24 kg',
      openWomen: '2 × 16 kg',
      proMen: '2 × 32 kg',
      proWomen: '2 × 24 kg',
    },
    icon: 'weight-kilogram',
  },
  {
    index: 7,
    name: 'Sandbag Lunges',
    metric: '100 m',
    distanceMeters: 100,
    loads: {
      openMen: '20 kg',
      openWomen: '10 kg',
      proMen: '30 kg',
      proWomen: '20 kg',
    },
    icon: 'sack',
  },
  {
    index: 8,
    name: 'Wall Balls',
    metric: '100 reps',
    loads: {
      openMen: '6 kg · 3 m target',
      openWomen: '4 kg · 2.7 m target',
      proMen: '9 kg · 3 m target',
      proWomen: '6 kg · 3 m target',
    },
    icon: 'basketball',
  },
];

export interface HyroxPlannedSegment {
  /** 0-based position in the 16-segment race. */
  position: number;
  name: string;
  segmentType: 'run' | 'station';
  metric: string;
  distanceMeters?: number;
  /** Load target for the chosen division ('—' for unloaded stations). */
  load?: string;
  icon: string;
}

/** The full 16-segment race plan: Run 1 km → station, ×8. */
export function hyroxRacePlan(division: HyroxDivision): HyroxPlannedSegment[] {
  const plan: HyroxPlannedSegment[] = [];
  for (const station of HYROX_STATIONS) {
    plan.push({
      position: plan.length,
      name: `Run ${station.index}`,
      segmentType: 'run',
      metric: '1 km',
      distanceMeters: 1000,
      icon: 'run',
    });
    plan.push({
      position: plan.length,
      name: station.name,
      segmentType: 'station',
      metric: station.metric,
      distanceMeters: station.distanceMeters,
      load: station.loads[division],
      icon: station.icon,
    });
  }
  return plan;
}

/** Total running distance in a full race: 8 km. */
export const HYROX_TOTAL_RUN_METERS = 8000;

export function formatRaceClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
