import {
  importNote,
  mapImportedHybrid,
  mapImportedRun,
  mapImportedWorkout,
  metersToUnit,
} from '../src/health/importMapping';
import type { ImportedHealthSession } from '../src/health/types';
import { check, checkClose, suite } from './helpers';

export function runImportMappingTests(): void {
  suite('importMapping');

  checkClose('5000m in km', metersToUnit(5000, 'km'), 5, 0.001);
  checkClose('5000m in mi', metersToUnit(5000, 'mi'), 3.11, 0.005);
  check('negative meters clamped', metersToUnit(-10, 'km'), 0);

  check('note without source', importNote('Apple Health'), 'Imported from Apple Health');
  check(
    'note with distinct source',
    importNote('Apple Health', 'Apple Watch'),
    'Imported from Apple Health (Apple Watch)'
  );
  check(
    'note with same source collapses',
    importNote('Apple Health', 'Apple Health'),
    'Imported from Apple Health'
  );

  const session: ImportedHealthSession = {
    externalId: 'ext1',
    kind: 'run',
    title: 'Morning Run',
    dateIso: '2026-08-18T07:00:00Z',
    durationSeconds: 1801.7,
    distanceMeters: 5000,
    sourceName: 'Apple Watch',
  };

  const runInput = mapImportedRun(session, 'km', 'Apple Health');
  check('run distance', runInput.distance, 5);
  check('run duration floored', runInput.durationSeconds, 1801);
  check('run type', runInput.runType, 'Outdoor');

  const workoutInput = mapImportedWorkout(session, 'Apple Health');
  check('workout title', workoutInput.title, 'Morning Run');

  const hybridInput = mapImportedHybrid(session, 'Apple Health');
  check('hybrid one segment', hybridInput.segments.length, 1);
  check('hybrid segment duration', hybridInput.segments[0].durationSeconds, 1801);
}
