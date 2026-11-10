// Alias @/ → src/ (docs/ARQUITECTURA.md § 6). Debe coincidir con «paths» de tsconfig.json y con
// «moduleNameMapper» de jest.config.js.
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
  ],
};
