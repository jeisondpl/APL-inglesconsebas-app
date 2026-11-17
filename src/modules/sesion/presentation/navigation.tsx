import type { ComponentType } from 'react';

import { LoginScreen } from './screens/LoginScreen';

/** Rutas del flujo Auth (sin sesión). La bienvenida (EXT-01) es un módulo propio, `onboarding`. */
export type AuthParamList = {
  Login: undefined;
};

/**
 * Ruta inicial del flujo Auth: siempre `Login`. Es la rama «sin bienvenida» del arranque: el
 * navegador raíz decide entre la bienvenida (EXT-01) y Auth con `rutaInicialRaiz`.
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
