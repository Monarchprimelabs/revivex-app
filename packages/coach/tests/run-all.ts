import { report } from '@revivex/test-utils';
import { runAdjustTests, runCoachTests, runCompletionTests } from './coach.test';

runCoachTests();
runAdjustTests();
runCompletionTests();
process.exit(report());
