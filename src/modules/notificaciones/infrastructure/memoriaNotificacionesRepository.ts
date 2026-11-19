import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import type { IArgsRegistrarDispositivo } from '../domain/entities/Notificaciones.entities';
import type { NotificacionesRepository } from '../domain/models/NotificacionesRepository';

export interface IMemoriaNotificaciones extends NotificacionesRepository {
  /** Lo que se registró, en orden. */
  registrados: IArgsRegistrarDispositivo[];
}

/** Puerto en memoria para pruebas. `falla` hace que el registro responda con ese error. */
export function crearMemoriaNotificacionesRepository(falla?: {
  msg: string;
  code?: number;
}): IMemoriaNotificaciones {
  const registrados: IArgsRegistrarDispositivo[] = [];
  return {
    registrados,
    async registrarDispositivo(args) {
      if (falla) {
        return respuestaError(falla.msg, falla.code);
      }
      registrados.push(args);
      return respuestaOk(undefined);
    },
  };
}
