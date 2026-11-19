import * as Keychain from 'react-native-keychain';

import type {
  BiometriaPort,
  ResultadoBiometria,
} from '@/native/ports/BiometriaPort';

const SERVICIO = 'com.inglesconsebas.app.biometria';
const TITULO = 'Inglés con Sebas';
const SUBTITULO = 'Desbloquea la app con tu huella o rostro';

/**
 * Adaptador de BiometriaPort con react-native-keychain: un marcador guardado con control de acceso
 * biométrico (o código del equipo), así que leerlo obliga a verificar a la persona. No guarda ningún
 * secreto de la sesión. Nunca lanza: cancelar o fallar es `cancelado`.
 */
export function crearKeychainBiometriaAdapter(): BiometriaPort {
  const disponible = async () => {
    try {
      return (await Keychain.getSupportedBiometryType()) !== null;
    } catch {
      return false;
    }
  };

  const autenticar = async (): Promise<ResultadoBiometria> => {
    try {
      const r = await Keychain.getGenericPassword({
        service: SERVICIO,
        authenticationPrompt: { title: TITULO, subtitle: SUBTITULO },
      });
      return r ? { tipo: 'ok' } : { tipo: 'cancelado' };
    } catch {
      return { tipo: 'cancelado' };
    }
  };

  return {
    disponible,
    async activar() {
      if (!(await disponible())) {
        return { tipo: 'no_disponible' };
      }
      try {
        const guardado = await Keychain.setGenericPassword('app', '1', {
          service: SERVICIO,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          accessControl:
            Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
        if (guardado === false) {
          return { tipo: 'cancelado' };
        }
      } catch {
        return { tipo: 'cancelado' };
      }
      // Comprobar que se puede verificar antes de dar por activado el bloqueo.
      return autenticar();
    },
    async desactivar() {
      try {
        await Keychain.resetGenericPassword({ service: SERVICIO });
      } catch {
        // Nada que borrar.
      }
    },
    autenticar,
  };
}
