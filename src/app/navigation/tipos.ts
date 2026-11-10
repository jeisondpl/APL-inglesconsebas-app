/** Rutas del navegador raíz. La feature de sesión lo dividirá en los flujos Auth y App. */
export type RaizParamList = {
  InicioProvisional: undefined;
};

declare global {
  // Tipado global de useNavigation y useRoute (React Navigation).
  namespace ReactNavigation {
    interface RootParamList extends RaizParamList {}
  }
}
