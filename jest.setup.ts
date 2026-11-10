// Mocks globales de Jest para los módulos nativos que no existen en el entorno de pruebas.
// Un test puede sobrescribirlos con su propio jest.mock.

// react-native-config lee las variables de .env desde el lado nativo.
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { API_URL: 'http://localhost:8080/api', APP_ENV: 'dev' },
  Config: { API_URL: 'http://localhost:8080/api', APP_ENV: 'dev' },
}));

// Mock oficial de react-native-safe-area-context (insets y marcos fijos).
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

// react-native-toast-message: el host no pinta nada y show/hide son espías.
jest.mock('react-native-toast-message', () => {
  const real = jest.requireActual('react-native-toast-message');
  const Toast = Object.assign(() => null, {
    show: jest.fn(),
    hide: jest.fn(),
  });
  return { ...real, __esModule: true, default: Toast };
});
