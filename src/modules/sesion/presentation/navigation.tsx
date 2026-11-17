import type { ComponentType } from 'react';

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

/** Lo que se usa del navegador raíz: su `Screen`, con cualquier lista de rutas que incluya Auth. */
export interface IPilaAuth {
  Screen: ComponentType<{
    name: keyof AuthParamList;
    component: ComponentType;
  }>;
}

/** Registra las pantallas del flujo Auth dentro del navegador raíz. */
export function pantallasAuth(Pila: IPilaAuth) {
  return <Pila.Screen name="Login" component={LoginScreen} />;
}
