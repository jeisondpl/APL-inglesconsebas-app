import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type {
  IAvisoAbierto,
  PlataformaPush,
  PushPort,
} from '@/native/ports/PushPort';

interface IMensajeRemoto {
  data?: Record<string, string | object> | undefined;
}

/** `data` de FCM → aviso. Solo texto: `id` llega como string. */
export function avisoDe(mensaje: IMensajeRemoto | null): IAvisoAbierto | null {
  const tipo = mensaje?.data?.tipo;
  if (typeof tipo !== 'string' || tipo === '') {
    return null;
  }
  const id = Number(mensaje?.data?.id);
  return { tipo, id: Number.isInteger(id) && id > 0 ? id : null };
}

const plataformaActual = (): PlataformaPush =>
  Platform.OS === 'ios' ? 'ios' : 'android';

/** Android 13+ pide POST_NOTIFICATIONS en ejecución; antes no hace falta. iOS pide por Firebase. */
async function hayPermiso(
  mensajeria: ReturnType<typeof getMessaging>,
): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Number(Platform.Version) < 33) {
      return true;
    }
    const r = await PermissionsAndroid.request(
      'android.permission.POST_NOTIFICATIONS',
    );
    return r === PermissionsAndroid.RESULTS.GRANTED;
  }
  const estado = await requestPermission(mensajeria);
  return (
    estado === AuthorizationStatus.AUTHORIZED ||
    estado === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Adaptador de PushPort con `@react-native-firebase/messaging` (API modular). Sin
 * `google-services.json` la app compila y arranca, pero Firebase no se inicia: toda llamada falla y
 * aquí se traduce a `no_disponible`. El primer plano no muestra la notificación del sistema: la
 * pantalla ya se actualiza sola.
 */
export function crearFirebasePushAdapter(): PushPort {
  return {
    async registrar() {
      try {
        const mensajeria = getMessaging();
        if (!(await hayPermiso(mensajeria))) {
          return { tipo: 'denegado' };
        }
        const token = await getToken(mensajeria);
        if (!token) {
          return { tipo: 'no_disponible' };
        }
        return {
          tipo: 'ok',
          token,
          plataforma: plataformaActual(),
        };
      } catch {
        return { tipo: 'no_disponible' };
      }
    },
    alRenovarToken(escuchar) {
      try {
        return onTokenRefresh(getMessaging(), token =>
          escuchar(token, plataformaActual()),
        );
      } catch {
        return () => undefined;
      }
    },
    alAbrirAviso(escuchar) {
      try {
        const mensajeria = getMessaging();
        const darAviso = (m: IMensajeRemoto | null) => {
          const aviso = avisoDe(m);
          if (aviso) {
            escuchar(aviso);
          }
        };
        getInitialNotification(mensajeria).then(darAviso, () => undefined);
        return onNotificationOpenedApp(mensajeria, darAviso);
      } catch {
        return () => undefined;
      }
    },
  };
}
