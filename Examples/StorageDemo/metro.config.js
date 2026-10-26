// The example uses the library from this repository (`file:../..`), so Metro has to watch the
// repository root. React and React Native must still come from the example's node_modules:
// the root has its own copies for the library's tests, and two Reacts in one bundle break hooks.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repositoryRoot = path.resolve(projectRoot, '../..');
const singletons = new Set(['react', 'react-dom', 'react-native']);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [new RegExp(`^${escape(repositoryRoot)}/node_modules/`)];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const packageName = moduleName.startsWith('@')
    ? moduleName.split('/').slice(0, 2).join('/')
    : moduleName.split('/')[0];
  if (singletons.has(packageName)) {
    const fromExample = { ...context, originModulePath: path.join(projectRoot, 'index.ts') };
    return context.resolveRequest(fromExample, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
