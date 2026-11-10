// Umbrales de cobertura de docs/CALIDAD.md: 90 % en el dominio y los casos de uso de cada módulo, 70 % global.
// Se generan por carpeta existente: Jest falla si un umbral apunta a una ruta sin archivos (módulos aún no creados).
const fs = require('fs');
const path = require('path');

const ESTRICTO = { statements: 90, branches: 90, functions: 90, lines: 90 };
const modulos = path.join(__dirname, 'src', 'modules');
const umbralesPorCapa = {};
if (fs.existsSync(modulos)) {
  for (const modulo of fs.readdirSync(modulos)) {
    for (const capa of ['domain', 'aplications']) {
      if (fs.existsSync(path.join(modulos, modulo, capa))) {
        umbralesPorCapa[`./src/modules/${modulo}/${capa}/`] = ESTRICTO;
      }
    }
  }
}

module.exports = {
  preset: '@react-native/jest-preset',
  // Alias @/ → src/ (mismo que tsconfig.json y babel.config.js).
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: { statements: 70, branches: 70, functions: 70, lines: 70 },
    ...umbralesPorCapa,
  },
};
