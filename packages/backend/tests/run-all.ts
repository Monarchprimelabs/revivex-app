import { report } from '@revivex/test-utils';
import { runMapperTests } from './mappers.test';
import { runSyncTests } from './sync.test';

runMapperTests();
runSyncTests().then(
  () => process.exit(report()),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
