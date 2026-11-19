import type { ComponentType, JSX } from 'react';

import { OnboardingScreen } from './screens/OnboardingScreen';

/** Rutas de la bienvenida (EXT-01). El navegador raíz decide si se monta con `rutaInicialRaiz`. */
export type OnboardingParamList = {
  Onboarding: undefined;
};

/** Lo que se usa del navegador raíz: su `Screen`, con cualquier lista de rutas que incluya Onboarding. */
export interface IPilaOnboarding {
  Screen: ComponentType<{
    name: keyof OnboardingParamList;
    component: ComponentType;
  }>;
}

/** Registra la pantalla de la bienvenida dentro del navegador raíz. */
export function pantallasOnboarding(Pila: IPilaOnboarding): JSX.Element {
  return <Pila.Screen name="Onboarding" component={OnboardingScreen} />;
}
