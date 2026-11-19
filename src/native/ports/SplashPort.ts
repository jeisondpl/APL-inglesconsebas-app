/**
 * Splash nativo de arranque. Se muestra desde el lado nativo hasta que la app lo oculta, cuando
 * la navegación está lista.
 */
export interface SplashPort {
  /** Oculta el splash. Con `fundido`, se desvanece. Nunca rechaza. */
  ocultar(opciones?: { fundido?: boolean }): Promise<void>;
}
