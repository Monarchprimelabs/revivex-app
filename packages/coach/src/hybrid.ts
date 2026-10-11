import { CUSTOM_HYBRID_SEGMENTS, HYBRID_BENCHMARK_SEGMENTS } from '@revivex/core';
import type { HybridBlock, ReadinessAssessment } from './types';

export function buildHybridBlock(readiness: ReadinessAssessment | undefined): { block: HybridBlock; notes: string[] } {
  if (readiness?.band === 'moderate') {
    return {
      block: {
        type: 'hybrid',
        sessionType: 'Custom Hybrid',
        segments: CUSTOM_HYBRID_SEGMENTS.map((segment) => ({ ...segment })),
        rounds: 3,
        note: 'Three rounds of a short run into one station. Keep the stations smooth, not maximal.',
      },
      notes: ['Readiness is moderate, so the benchmark is swapped for a shorter three-round circuit.'],
    };
  }
  return {
    block: {
      type: 'hybrid',
      sessionType: 'Hybrid Benchmark',
      segments: HYBRID_BENCHMARK_SEGMENTS.map((segment) => ({ ...segment })),
      rounds: 1,
      note: 'Run into each station with no rest between. Note your total time for the next benchmark.',
    },
    notes: [],
  };
}

export function estimateHybridMinutes(block: HybridBlock): number {
  return block.rounds > 1 ? 30 : 45;
}
