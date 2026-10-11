// Metro config for Direction A.
// Expo SDK 54 already handles the npm-workspace layout. The only addition is a
// web resolver that maps native-only modules to an empty module, so the lazy
// require() calls around maps, health, purchases and nitro fail safely on web
// and those features report themselves unavailable, exactly as in Expo Go.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const NATIVE_ONLY = [
  'react-native-maps',
  '@kingstinct/react-native-healthkit',
  'react-native-health-connect',
  'react-native-purchases',
  'react-native-nitro-modules',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && NATIVE_ONLY.some((name) => moduleName === name || moduleName.startsWith(`${name}/`))) {
    return { type: 'empty' };
  }
  const resolve = originalResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
