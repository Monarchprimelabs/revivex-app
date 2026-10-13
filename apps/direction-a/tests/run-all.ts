/**
 * Runs the Direction A app-level suites (device integrations that stay in the app).
 * Shared logic suites live in packages/core/tests.
 */

import { report } from '@revivex/test-utils';
import { runImportMappingTests } from './importMapping.test';
import { runNativeModuleTests } from './nativeModules.test';

runImportMappingTests();
runNativeModuleTests().then(
  () => process.exit(report()),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
