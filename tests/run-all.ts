/**
 * Runs every suite and exits non-zero on failure.
 * Usage: npm test  (wired to `tsx tests/run-all.ts`)
 */

import { report } from './helpers';
import { runAchievementsTests } from './achievements.test';
import { runGpsTests } from './gpsTracking.test';
import { runHyroxTests } from './hyrox.test';
import { runImportMappingTests } from './importMapping.test';
import { runLastPerformanceTests } from './lastPerformance.test';
import { runPlateMathTests } from './plateMath.test';
import { runRouteProjectionTests } from './routeProjection.test';
import { runWeeklySummaryTests } from './weeklySummary.test';
import { runWorkoutToRoutineTests } from './workoutToRoutine.test';

runPlateMathTests();
runWeeklySummaryTests();
runLastPerformanceTests();
runGpsTests();
runImportMappingTests();
runWorkoutToRoutineTests();
runAchievementsTests();
runRouteProjectionTests();
runHyroxTests();

process.exit(report());
