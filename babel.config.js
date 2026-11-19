// Alias @/ → src/ (docs/ARQUITECTURA.md § 6). Debe coincidir con «paths» de tsconfig.json y con
// «moduleNameMapper» de jest.config.js.
// react-native-worklets/plugin (Reanimated 4, F1-04) debe ir el último de la lista: convierte las
// funciones `'worklet'` y las de los hooks de Reanimated para que corran en el hilo de UI.
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: { '@': './src' },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
