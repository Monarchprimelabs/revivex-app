import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '../theme/theme';
import posesJson from '../data/exercisePoses.json';

/**
 * ReviveX original exercise figures (Phase 42) — hand-designed pictogram
 * athletes (Olympic-icon style) drawn from pose data in
 * src/data/exercisePoses.json. All artwork is original to this project;
 * no licensed packs.
 */

interface Pose {
  head: number[];
  body: number[][];
  equip: number[][];
}

const poses = posesJson as Record<string, Pose>;

export type PoseArchetype = keyof typeof posesJson;

/** Exact library-id mapping. */
const ID_TO_ARCHETYPE: Record<string, string> = {
  'bench-press': 'benchPress',
  'incline-db-press': 'inclinePress',
  'dumbbell-fly': 'fly',
  'shoulder-press': 'overheadPress',
  'lateral-raise': 'lateralRaise',
  'rear-delt-fly': 'rearFly',
  'lat-pulldown': 'pulldown',
  'seated-cable-row': 'seatedRow',
  'barbell-row': 'bentRow',
  'biceps-curl': 'curl',
  'hammer-curl': 'curl',
  'triceps-pushdown': 'pushdown',
  'overhead-triceps-extension': 'overheadExt',
  'leg-press': 'legPress',
  'hack-squat': 'legPress',
  'leg-extension': 'legExtension',
  'hamstring-curl': 'legCurl',
  'romanian-deadlift': 'rdl',
  'hip-thrust': 'hipThrust',
  'standing-calf-raise': 'calfRaise',
  'cable-crunch': 'crunch',
  'plank': 'plank',
};

/** Name-based fallback so custom/imported exercises still get a figure. */
export function archetypeFor(exerciseId: string | undefined, name: string): string | undefined {
  if (exerciseId && ID_TO_ARCHETYPE[exerciseId]) return ID_TO_ARCHETYPE[exerciseId];

  const n = name.toLowerCase();
  if (/pulldown|pull-up|pullup|chin/.test(n)) return 'pulldown';
  if (/pushdown/.test(n)) return 'pushdown';
  if (/row/.test(n)) return /seated|cable/.test(n) ? 'seatedRow' : 'bentRow';
  if (/curl/.test(n)) return /leg|hamstring/.test(n) ? 'legCurl' : 'curl';
  if (/extension/.test(n)) return /leg/.test(n) ? 'legExtension' : 'overheadExt';
  if (/fly/.test(n)) return /rear|reverse/.test(n) ? 'rearFly' : 'fly';
  if (/raise/.test(n)) return /calf/.test(n) ? 'calfRaise' : 'lateralRaise';
  if (/deadlift|rdl|good morning/.test(n)) return 'rdl';
  if (/thrust|bridge/.test(n)) return 'hipThrust';
  if (/plank/.test(n)) return 'plank';
  if (/crunch|sit-?up|ab /.test(n)) return 'crunch';
  if (/run|sprint|jog|treadmill/.test(n)) return 'run';
  if (/squat|sled/.test(n)) return 'legPress';
  if (/press/.test(n)) {
    if (/shoulder|overhead|military|push press/.test(n)) return 'overheadPress';
    if (/incline/.test(n)) return 'inclinePress';
    if (/leg/.test(n)) return 'legPress';
    return 'benchPress';
  }
  return undefined;
}

export default function ExerciseFigure({
  archetype,
  color = colors.accentTeal,
  size = 40,
}: {
  archetype: string;
  color?: string;
  size?: number;
}) {
  const pose = poses[archetype];
  if (!pose) return null;

  const s = size / 100;
  const bodyWidth = Math.max(4.5, size * 0.055) / s;
  const equipWidth = Math.max(3, size * 0.035) / s;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {pose.equip.map(([x1, y1, x2, y2], index) => (
        <Line
          key={`e${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.textMuted}
          strokeWidth={equipWidth}
          strokeLinecap="round"
        />
      ))}
      {pose.body.map(([x1, y1, x2, y2], index) => (
        <Line
          key={`b${index}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={bodyWidth}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={pose.head[0]} cy={pose.head[1]} r={7} fill={color} />
    </Svg>
  );
}
