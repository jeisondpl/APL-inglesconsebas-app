import type { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from './screens/LoginScreen';

/** Rutas del flujo Auth (sin sesión). EXT-01 añadirá `Onboarding`. */
export type AuthParamList = {
  Login: undefined;
};

/**
 * Ruta inicial del flujo Auth. Hoy siempre `Login`; es el punto de enganche del onboarding
 * (EXT-01), que añadirá su ruta y la condición para mostrarla.
 */
export function rutaInicialAuth(): keyof AuthParamList {
  return 'Login';
}

type Pila = ReturnType<typeof createNativeStackNavigator<AuthParamList>>;

/** Registra las pantallas del flujo Auth dentro del navegador raíz. */
export function pantallasAuth(Pila: Pila) {
  return <Pila.Screen name="Login" component={LoginScreen} />;
}
