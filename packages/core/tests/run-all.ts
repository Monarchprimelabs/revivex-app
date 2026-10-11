/**
 * Runs every @revivex/core suite and exits non-zero on failure.
 * Usage: npm test (wired to `tsx tests/run-all.ts`)
 */

import { report } from '@revivex/test-utils';
import { runAchievementsTests } from './achievements.test';
import { runGpsTests } from './gpsTracking.test';
import { runHyroxTests } from './hyrox.test';
import { runLastPerformanceTests } from './lastPerformance.test';
import { runPlateMathTests } from './plateMath.test';
import { runRouteProjectionTests } from './routeProjection.test';
import { runWeeklySummaryTests } from './weeklySummary.test';
import { runWorkoutToRoutineTests } from './workoutToRoutine.test';
import { runSetTypeTests } from './setTypes.test';
import { runDataExportTests } from './dataExport.test';

runPlateMathTests();
runWeeklySummaryTests();
runLastPerformanceTests();
runGpsTests();
runWorkoutToRoutineTests();
runAchievementsTests();
runRouteProjectionTests();
runHyroxTests();
runSetTypeTests();
runDataExportTests();

process.exit(report());
