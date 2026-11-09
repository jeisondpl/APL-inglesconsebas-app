const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Si el proyecto se abre desde una unidad virtual (subst, usada por scripts/build-apk.mjs en Windows para acortar
 * rutas), Node resuelve los módulos a su ruta real: se vigila también esa ruta para que Metro pueda calcular sus SHA-1.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const rutaReal = fs.realpathSync.native(__dirname);
const config = rutaReal !== __dirname ? { watchFolders: [rutaReal] } : {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
