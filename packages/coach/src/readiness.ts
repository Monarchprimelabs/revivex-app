import type { ReadinessAssessment, ReadinessBand, ReadinessInput } from './types';

/**
 * Readiness score: sleep 40%, soreness 35% (inverted), energy 25%, scaled to 0-100.
 * Low (<40) turns the day into recovery. Moderate (40-65) keeps the session with
 * 30% less volume and no load increases. High (>65) is a full session.
 */
export function readinessScore(input: ReadinessInput): number {
  const sleep = (input.sleep - 1) / 4;
  const soreness = (5 - input.soreness) / 4;
  const energy = (input.energy - 1) / 4;
  return Math.round(100 * (0.4 * sleep + 0.35 * soreness + 0.25 * energy));
}

export function readinessBand(score: number): ReadinessBand {
  if (score < 40) return 'low';
  if (score <= 65) return 'moderate';
  return 'high';
}

export function assessReadiness(input: ReadinessInput): ReadinessAssessment {
  const score = readinessScore(input);
  const band = readinessBand(score);
  const volumeScale = band === 'high' ? 1 : band === 'moderate' ? 0.7 : 0;
  const parts: string[] = [];
  if (input.sleep <= 2) parts.push('short sleep');
  if (input.soreness >= 4) parts.push('heavy soreness');
  if (input.energy <= 2) parts.push('low energy');
  const summary =
    band === 'high'
      ? `Readiness ${score}/100. You are good to train at full volume.`
      : band === 'moderate'
        ? `Readiness ${score}/100${parts.length ? ` (${parts.join(', ')})` : ''}. Volume is trimmed 30% and loads hold steady.`
        : `Readiness ${score}/100${parts.length ? ` (${parts.join(', ')})` : ''}. Today is for recovery.`;
  return { score, band, volumeScale, summary };
}
