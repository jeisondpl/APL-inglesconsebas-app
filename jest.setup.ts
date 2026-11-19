// Mocks globales de Jest para los módulos nativos que no existen en el entorno de pruebas.
// Un test puede sobrescribirlos con su propio jest.mock.

// react-native-config lee las variables de .env desde el lado nativo.
jest.mock('react-native-config', () => ({
  __esModule: true,
  default: { API_URL: 'http://localhost:8080/api', APP_ENV: 'dev' },
  Config: { API_URL: 'http://localhost:8080/api', APP_ENV: 'dev' },
}));

// @react-native-google-signin (F1-06): su mock oficial no está en `exports`, así que se imita aquí.
// signIn devuelve un ID token fijo; un test cambia la respuesta con mockResolvedValueOnce.
jest.mock('@react-native-google-signin/google-signin', () => ({
  __esModule: true,
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({ type: 'success', data: { idToken: 'mockIdToken' } }),
    ),
    hasPreviousSignIn: jest.fn(() => false),
    signOut: jest.fn(() => Promise.resolve(null)),
  },
  isCancelledResponse: (r: { type?: string }) => r?.type === 'cancelled',
  isErrorWithCode: (e: unknown) =>
    typeof e === 'object' && e !== null && 'code' in e,
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
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

// react-native-bootsplash: el splash nativo no existe en Jest (mock del README de la librería).
jest.mock('react-native-bootsplash', () => {
  const BootSplash = {
    hide: jest.fn(() => Promise.resolve()),
    isVisible: jest.fn(() => false),
    useHideAnimation: jest.fn(() => ({
      container: {},
      logo: { source: 0 },
      brand: { source: 0 },
    })),
  };
  return { __esModule: true, default: BootSplash, ...BootSplash };
});

// react-native-keychain: almacén en memoria por servicio (el Keychain/Keystore no existe en Jest).
jest.mock('react-native-keychain', () => {
  const almacen = new Map<string, { username: string; password: string }>();
  const servicio = (opciones?: { service?: string }) =>
    opciones?.service ?? 'por-defecto';
  const Keychain = {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
        'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    setGenericPassword: jest.fn(
      (username: string, password: string, opciones?: { service?: string }) => {
        almacen.set(servicio(opciones), { username, password });
        return Promise.resolve({
          service: servicio(opciones),
          storage: 'mock',
        });
      },
    ),
    getGenericPassword: jest.fn((opciones?: { service?: string }) => {
      const valor = almacen.get(servicio(opciones));
      return Promise.resolve(
        valor
          ? { ...valor, service: servicio(opciones), storage: 'mock' }
          : false,
      );
    }),
    resetGenericPassword: jest.fn((opciones?: { service?: string }) =>
      Promise.resolve(almacen.delete(servicio(opciones))),
    ),
  };
  return { __esModule: true, default: Keychain, ...Keychain };
});

// Push (F2-03): Firebase no existe en Jest. Los tests del adaptador y de la app lo reemplazan.
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('')),
  requestPermission: jest.fn(() => Promise.resolve(0)),
  onTokenRefresh: jest.fn(() => () => undefined),
  onNotificationOpenedApp: jest.fn(() => () => undefined),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
}));

// Chat con voz (F3-01): sin módulos nativos en Jest. Un test del adaptador los vuelve a mockear.
jest.mock('react-native-nitro-sound', () => ({
  __esModule: true,
  default: {},
  AudioEncoderAndroidType: { AAC: 3 },
  OutputFormatAndroidType: { MPEG_4: 2 },
}));
jest.mock('react-native-blob-util', () => ({ __esModule: true, default: {} }));

// react-native-reanimated 4 (F1-04): mock oficial. Las animaciones resuelven al instante a su valor
// final, `useAnimatedStyle` se calcula en cada render y `Animated.View` es un View normal.
// react-native-worklets no tiene runtime de UI en Jest: se usa su mock oficial.
jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  jest.requireActual('react-native-reanimated/mock'),
);
