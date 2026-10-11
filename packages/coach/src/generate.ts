import { assessReadiness } from './readiness';
import { hardRunWithin, isStrengthSlot, strengthSlotFatigue } from './fatigue';
import { buildHybridBlock, estimateHybridMinutes } from './hybrid';
import { buildRunBlock, estimateRunMinutes } from './running';
import { buildStrengthBlocks, estimateStrengthMinutes } from './strength';
import { COACH_ENGINE_VERSION, type CoachInput, type DayPlan, type PlanBlock, type SlotKind } from './types';
import { SLOT_TITLES, localDateKey, sessionsThisWeek, slotKindToPlanKind, weekTemplateFor } from './week';

function templateLabel(template: SlotKind[]): string {
  return template.map((slot) => SLOT_TITLES[slot].toLowerCase()).join(', ');
}

function recoveryPlan(base: Omit<DayPlan, 'kind' | 'title' | 'subtitle' | 'estimatedMinutes' | 'blocks'>, reason: string, rest: boolean): DayPlan {
  if (rest) {
    return {
      ...base,
      kind: 'rest',
      title: 'Rest day',
      subtitle: 'Nothing to log. Sleep, eat, hydrate.',
      estimatedMinutes: 0,
      blocks: [],
      rationale: [...base.rationale, reason],
    };
  }
  const blocks: PlanBlock[] = [
    { type: 'recovery', activity: 'Easy walk', durationMinutes: 20, note: 'Outside if you can. Conversational pace.' },
    { type: 'recovery', activity: 'Mobility flow', durationMinutes: 10, note: 'Hips, thoracic spine, ankles. Slow breathing.' },
  ];
  return {
    ...base,
    kind: 'recovery',
    title: 'Active recovery',
    subtitle: '30 minutes of easy movement',
    estimatedMinutes: 30,
    blocks,
    rationale: [...base.rationale, reason],
  };
}

/**
 * The daily coach. Pure and deterministic: the same profile, history,
 * readiness and date always produce the same plan.
 */
export function generateDayPlan(input: CoachInput): DayPlan {
  const now = input.date ?? new Date();
  const { profile, history } = input;
  const readiness = input.readiness ? assessReadiness(input.readiness) : undefined;
  const template = weekTemplateFor(profile.trainingFocus, profile.weeklyTrainingTarget);
  const sessions = sessionsThisWeek(history, now);
  const completed = sessions.length;
  const rationale: string[] = [];

  const base = {
    date: localDateKey(now),
    weekTemplate: template,
    completedThisWeek: completed,
    engineVersion: COACH_ENGINE_VERSION,
    readiness,
    rationale,
  };

  rationale.push(
    `Your week is built for ${profile.trainingFocus.toLowerCase()} at ${template.length} sessions: ${templateLabel(template)}. ${
      completed === 0 ? 'Nothing logged yet this week.' : `${completed} logged so far this week.`
    }`
  );
  if (readiness) rationale.push(readiness.summary);

  if (readiness?.band === 'low') {
    const trainedYesterday = sessions.some((session) => now.getTime() - new Date(session.date).getTime() < 36 * 3600 * 1000);
    return recoveryPlan(base, trainedYesterday ? 'Low readiness after a recent session, so today is a full rest day.' : 'Low readiness, so today is easy movement instead of a session.', trainedYesterday);
  }

  if (completed >= template.length) {
    return recoveryPlan(base, `You have already completed ${template.length} sessions this week, which is your target. Extra work now costs more than it gives.`, false);
  }

  let index = completed;
  let slot: SlotKind | undefined;
  for (let i = completed; i < template.length; i += 1) {
    const candidate = template[i];
    if (isStrengthSlot(candidate)) {
      const fatigue = strengthSlotFatigue(candidate, history.workouts, now);
      if (fatigue.fatigued) {
        rationale.push(
          `${SLOT_TITLES[candidate]} was trained ${fatigue.hoursSince ?? 'under 48'} hours ago (${fatigue.sets} sets), so it is skipped for now.`
        );
        continue;
      }
    }
    slot = candidate;
    index = i;
    break;
  }

  if (!slot) {
    return recoveryPlan(base, 'Everything left in the week is still recovering, so today is easy movement.', false);
  }

  if (index !== completed) rationale.push(`Today becomes session ${index + 1} of the week: ${SLOT_TITLES[slot].toLowerCase()}.`);
  else rationale.push(`Today is session ${index + 1} of the week: ${SLOT_TITLES[slot].toLowerCase()}.`);

  const kind = slotKindToPlanKind(slot);

  if (kind === 'lift') {
    const { blocks, progressionNotes } = buildStrengthBlocks(slot, profile, history.workouts, readiness);
    rationale.push(...progressionNotes.slice(0, 2));
    if (readiness?.band === 'moderate') rationale.push('Sets are reduced by one per exercise and loads hold steady.');
    return {
      ...base,
      kind,
      slot,
      title: SLOT_TITLES[slot],
      subtitle: `${blocks.length} exercises, ${blocks.reduce((sum, block) => sum + block.sets, 0)} sets`,
      estimatedMinutes: estimateStrengthMinutes(blocks),
      blocks,
    };
  }

  if (kind === 'run') {
    let effective = slot;
    const hard = hardRunWithin(history.runs, now);
    if (hard && slot !== 'run_easy') {
      effective = 'run_easy';
      rationale.push(`A ${hard.runType.toLowerCase()} run is less than 48 hours old, so today stays easy.`);
    }
    const { block, notes } = buildRunBlock(effective, profile, history.runs, readiness, now);
    rationale.push(...notes);
    return {
      ...base,
      kind,
      slot: effective,
      title: SLOT_TITLES[effective],
      subtitle: `${block.distance} ${block.distanceUnit} ${block.runType.toLowerCase()}`,
      estimatedMinutes: estimateRunMinutes(block),
      blocks: [block],
    };
  }

  const { block, notes } = buildHybridBlock(readiness);
  rationale.push(...notes);
  return {
    ...base,
    kind,
    slot,
    title: SLOT_TITLES[slot],
    subtitle: `${block.sessionType}, ${block.rounds} round${block.rounds === 1 ? '' : 's'}`,
    estimatedMinutes: estimateHybridMinutes(block),
    blocks: [block],
  };
}
