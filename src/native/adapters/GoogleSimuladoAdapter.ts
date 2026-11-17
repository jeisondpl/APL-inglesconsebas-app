import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';

/** Prefijo que la copia de desarrollo de Leap acepta como «token» de Google simulado. */
export const PREFIJO_GOOGLE_SIMULADO = 'simulado:';

/**
 * Google simulado (F1-06) mientras no hay client ID: el botón se ve y el flujo completo funciona
 * contra la copia de desarrollo de Leap (LEAP_GOOGLE_SIMULADO=1), entrando con `correo`. No abre
 * el selector de Google. Producción rechaza «simulado:», así que no abre ninguna puerta.
 */
export function crearGoogleSimuladoAdapter(correo: string): GoogleSignInPort {
  return {
    disponible: true,
    obtenerIdToken: () =>
      Promise.resolve({
        tipo: 'ok',
        idToken: `${PREFIJO_GOOGLE_SIMULADO}${correo}`,
      }),
    cerrarSesion: () => Promise.resolve(),
  };
}
