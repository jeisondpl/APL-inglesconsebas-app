import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import type {
  GoogleSignInPort,
  ResultadoIdTokenGoogle,
} from '@/native/ports/GoogleSignInPort';

/** Mensajes del selector de Google (los de Leap llegan aparte, en la respuesta del servidor). */
export const MENSAJES_GOOGLE = {
  playServices:
    'Necesitas Google Play Services actualizado para continuar con Google.',
  sinToken: 'Google no devolvió tus datos de acceso. Intenta de nuevo.',
  generico: 'No pudimos conectar con Google. Intenta de nuevo.',
} as const;

export interface IOpcionesGoogle {
  /** Client ID web de Google Cloud: la audiencia del ID token que verifica Leap. */
  webClientId: string | null;
  iosClientId?: string | null;
}

/**
 * Adaptador de GoogleSignInPort con @react-native-google-signin (API gratuita `GoogleSignin`, como
 * en Livic). Sin `webClientId` queda no disponible y no toca el SDK.
 */
export function crearGoogleSignInAdapter({
  webClientId,
  iosClientId,
}: IOpcionesGoogle): GoogleSignInPort {
  let configurado = false;
  const configurar = () => {
    if (!configurado && webClientId) {
      GoogleSignin.configure({
        webClientId,
        iosClientId: iosClientId ?? undefined,
      });
      configurado = true;
    }
  };

  return {
    disponible: Boolean(webClientId),

    async obtenerIdToken(): Promise<ResultadoIdTokenGoogle> {
      if (!webClientId) {
        return { tipo: 'error', mensaje: MENSAJES_GOOGLE.generico };
      }
      try {
        configurar();
        if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
        }
        const respuesta = await GoogleSignin.signIn();
        if (isCancelledResponse(respuesta)) {
          return { tipo: 'cancelado' };
        }
        const idToken = respuesta.data.idToken;
        return idToken
          ? { tipo: 'ok', idToken }
          : { tipo: 'error', mensaje: MENSAJES_GOOGLE.sinToken };
      } catch (err: unknown) {
        if (isErrorWithCode(err)) {
          if (
            err.code === statusCodes.SIGN_IN_CANCELLED ||
            err.code === statusCodes.IN_PROGRESS
          ) {
            return { tipo: 'cancelado' };
          }
          if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { tipo: 'error', mensaje: MENSAJES_GOOGLE.playServices };
          }
        }
        return { tipo: 'error', mensaje: MENSAJES_GOOGLE.generico };
      }
    },

    async cerrarSesion() {
      if (!webClientId) {
        return;
      }
      try {
        configurar();
        if (GoogleSignin.hasPreviousSignIn()) {
          await GoogleSignin.signOut();
        }
      } catch {
        // Best-effort: si falla, la próxima vez Google recuerda la cuenta; no bloquea el cierre.
      }
    },
  };
}
