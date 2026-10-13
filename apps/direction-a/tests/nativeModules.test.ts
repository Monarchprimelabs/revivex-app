import Module from 'node:module';
import path from 'node:path';
import { check, suite } from '@revivex/test-utils';
import type { HealthAdapter } from '../src/health/types';

/**
 * In Expo Go both health packages throw while loading, and Metro reports a
 * throw during a lazy require() as a fatal error before any catch runs. These
 * checks load each adapter with react-native replaced and prove the package
 * is required only when its native module is in the app binary.
 */

interface Scenario {
  nativeModules: string[];
  packages: Record<string, unknown>;
}

type Load = (request: string, parent: unknown, isMain: boolean) => unknown;
const loader = Module as unknown as { _load: Load };
const healthDir = path.join(__dirname, '../src/health');

async function availability(
  file: string,
  exportName: string,
  scenario: Scenario
): Promise<{ status: string; required: string[] }> {
  const required: string[] = [];
  const reactNative = {
    TurboModuleRegistry: {
      get: (name: string) => (scenario.nativeModules.includes(name) ? {} : null),
    },
  };
  const original = loader._load;
  loader._load = function load(request, parent, isMain) {
    if (request === 'react-native') return reactNative;
    if (request in scenario.packages) {
      required.push(request);
      return scenario.packages[request];
    }
    return original.call(this, request, parent, isMain);
  };
  try {
    // Fresh copies, so each scenario starts with an empty module cache.
    for (const name of ['nativeModule', file]) delete require.cache[require.resolve(path.join(healthDir, name))];
    const adapter = (require(path.join(healthDir, file)) as Record<string, HealthAdapter>)[exportName];
    return { status: await adapter.checkAvailability(), required };
  } finally {
    loader._load = original;
  }
}

const HEALTHKIT = '@kingstinct/react-native-healthkit';
const HEALTH_CONNECT = 'react-native-health-connect';

const healthKitPackage = { isHealthDataAvailableAsync: async () => true };
const healthConnectPackage = {
  getSdkStatus: async () => 3,
  SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
};

export async function runNativeModuleTests(): Promise<void> {
  suite('native modules (Expo Go safety)');

  const iosExpoGo = await availability('appleHealthAdapter', 'appleHealthAdapter', {
    nativeModules: [],
    packages: { [HEALTHKIT]: healthKitPackage },
  });
  check('Expo Go on iOS: Apple Health needs a dev build', iosExpoGo.status, 'needs-dev-build');
  check('Expo Go on iOS: HealthKit package never required', iosExpoGo.required, []);

  const iosBuild = await availability('appleHealthAdapter', 'appleHealthAdapter', {
    nativeModules: ['NitroModules'],
    packages: { [HEALTHKIT]: healthKitPackage },
  });
  check('dev build on iOS: Apple Health available', iosBuild.status, 'available');
  check('dev build on iOS: HealthKit package required once', iosBuild.required, [HEALTHKIT]);

  const androidExpoGo = await availability('healthConnectAdapter', 'healthConnectAdapter', {
    nativeModules: [],
    packages: { [HEALTH_CONNECT]: healthConnectPackage },
  });
  check('Expo Go on Android: Health Connect needs a dev build', androidExpoGo.status, 'needs-dev-build');
  check('Expo Go on Android: Health Connect package never required', androidExpoGo.required, []);

  const androidBuild = await availability('healthConnectAdapter', 'healthConnectAdapter', {
    nativeModules: ['HealthConnect'],
    packages: { [HEALTH_CONNECT]: healthConnectPackage },
  });
  check('dev build on Android: Health Connect available', androidBuild.status, 'available');
  check('dev build on Android: Health Connect package required once', androidBuild.required, [HEALTH_CONNECT]);
}
