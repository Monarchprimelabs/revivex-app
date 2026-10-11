import type { HybridDistanceUnit, HybridSegmentType, HybridSessionType } from '../types';

export interface HybridSegmentTemplate {
  name: string;
  segmentType: HybridSegmentType;
  distance?: number;
  distanceUnit?: HybridDistanceUnit;
}

export const HYBRID_SESSION_TYPES: HybridSessionType[] = [
  'HYROX Race Sim',
  'Hybrid Benchmark',
  'Custom Hybrid',
];

export const HYROX_RACE_SEGMENTS: HybridSegmentTemplate[] = [
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'SkiErg', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Sled Push', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Sled Pull', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Burpee Broad Jumps', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Row', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Farmer Carry', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Sandbag Lunges', segmentType: 'station' },
  { name: '1 km Run', segmentType: 'run', distance: 1, distanceUnit: 'km' },
  { name: 'Wall Balls', segmentType: 'station' },
];

export const HYBRID_BENCHMARK_SEGMENTS: HybridSegmentTemplate[] = [
  { name: 'Run', segmentType: 'run' },
  { name: 'SkiErg or Row', segmentType: 'station' },
  { name: 'Sled Push', segmentType: 'station' },
  { name: 'Farmer Carry', segmentType: 'station' },
  { name: 'Sandbag Lunges', segmentType: 'station' },
  { name: 'Wall Balls', segmentType: 'station' },
];

export const CUSTOM_HYBRID_SEGMENTS: HybridSegmentTemplate[] = [
  { name: 'Run', segmentType: 'run' },
  { name: 'Station', segmentType: 'station' },
];

export function isHybridSessionType(value: unknown): value is HybridSessionType {
  return (
    value === 'HYROX Race Sim' ||
    value === 'Hybrid Benchmark' ||
    value === 'Conditioning Circuit' ||
    value === 'Custom Hybrid' ||
    value === 'Other'
  );
}

export function getHybridTemplateSegments(sessionType: HybridSessionType): HybridSegmentTemplate[] {
  if (sessionType === 'HYROX Race Sim') return HYROX_RACE_SEGMENTS;
  if (sessionType === 'Hybrid Benchmark') return HYBRID_BENCHMARK_SEGMENTS;
  return CUSTOM_HYBRID_SEGMENTS;
}
