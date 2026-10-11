/**
 * Runs the Direction A app-level suites (device integrations that stay in the app).
 * Shared logic suites live in packages/core/tests.
 */

import { report } from '@revivex/test-utils';
import { runImportMappingTests } from './importMapping.test';

runImportMappingTests();

process.exit(report());
