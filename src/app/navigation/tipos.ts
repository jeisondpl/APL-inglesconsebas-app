import type { AuthParamList } from '@/modules/sesion/presentation/navigation';

/** Rutas del flujo App (con sesión): un inicio por rol y el escaparate de desarrollo. */
export type AppParamList = {
  InicioEstudiante: undefined;
  InicioProfe: undefined;
  InicioAdmin: undefined;
  /** Escaparate del sistema de diseño (F1-01b). Solo en __DEV__. */
  SistemaDiseno: undefined;
};

/** Rutas del navegador raíz: flujo Auth (sin sesión) y flujo App (con sesión). */
export type RaizParamList = AuthParamList & AppParamList;

declare global {
  // Tipado global de useNavigation y useRoute (React Navigation).
  namespace ReactNavigation {
    interface RootParamList extends RaizParamList {}
  }
}
