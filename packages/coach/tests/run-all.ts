import { report } from '@revivex/test-utils';
import { runAdjustTests, runCoachTests } from './coach.test';

runCoachTests();
runAdjustTests();
process.exit(report());
