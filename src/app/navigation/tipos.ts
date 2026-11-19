import type { OnboardingParamList } from '@/modules/onboarding/presentation/navigation';
import type { AuthParamList } from '@/modules/sesion/presentation/navigation';

/** Rutas del flujo App (con sesión): un inicio por rol y el escaparate de desarrollo. */
export type AppParamList = {
  InicioEstudiante: undefined;
  InicioProfe: undefined;
  InicioAdmin: undefined;
  /** Perfil (F1-03b, 1.14): estudiante y profe. */
  Perfil: undefined;
  /** Escaparate del sistema de diseño (F1-01b). Solo en __DEV__. */
  SistemaDiseno: undefined;
};

/** Rutas del navegador raíz: Auth (sin sesión), la bienvenida (EXT-01) y App (con sesión). */
export type RaizParamList = AuthParamList & OnboardingParamList & AppParamList;

declare global {
  // Tipado global de useNavigation y useRoute (React Navigation).
  namespace ReactNavigation {
    interface RootParamList extends RaizParamList {}
  }
}
