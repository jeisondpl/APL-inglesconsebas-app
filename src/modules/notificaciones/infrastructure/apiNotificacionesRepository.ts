import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type { NotificacionesRepository } from '../domain/models/NotificacionesRepository';

const API = 'api.php';

/** Adaptador de `devices` (register). La versión de la app la pone el servidor desde `appVersion`. */
export function crearApiNotificacionesRepository(
  api: ClienteApi,
  opciones: { etiquetaDispositivo: string },
): NotificacionesRepository {
  return {
    async registrarDispositivo({ token, plataforma }) {
      const r = await api.post<unknown>(
        API,
        {
          action: 'register',
          pushToken: token,
          platform: plataforma,
          provider: 'fcm',
          deviceLabel: opciones.etiquetaDispositivo,
        },
        { endpoint: 'devices' },
      );
      return r.error
        ? respuestaError(r.msg ?? textosComunes.errores.desconocido, r.code)
        : respuestaOk(undefined, r.code);
    },
  };
}
