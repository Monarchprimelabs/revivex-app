import { TurboModuleRegistry } from 'react-native';

/**
 * True when the app binary contains the named native module.
 *
 * Expo Go ships without third-party native code, and both health packages
 * look up their native module as soon as they load. A try/catch around a
 * lazy require() cannot contain that throw: Metro reports an error raised
 * while a module loads as a fatal error (the red screen) before the catch
 * runs. So the adapters ask first and never require a package whose native
 * module is missing.
 */
export function hasNativeModule(name: string): boolean {
  try {
    return TurboModuleRegistry.get(name) != null;
  } catch {
    return false;
  }
}
