import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaOk, type HttpResponse } from '@/shared/lib/HttpResponse';

import type { IResponseSesion } from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import {
  CLAVE_SESION,
  serializarSesion,
} from '../../domain/validations/sesion.validations';

export type RenovarSesion = (
  repo: SesionRepository,
  almacen: SecureStoragePort,
  sesion: IResponseSesion,
) => Promise<HttpResponse<IResponseSesion>>;

async function renovar(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  sesion: IResponseSesion,
): Promise<HttpResponse<IResponseSesion>> {
  const r = await repo.renovar();
  if (r.code === 401) {
    return { error: true, msg: r.msg, code: 401 };
  }
  if (r.error || !r.response) {
    // Sin red o error del servidor: se sigue con el token actual.
    return respuestaOk(sesion);
  }
  const renovada: IResponseSesion = { ...sesion, ...r.response };
  await almacen.guardar(CLAVE_SESION, serializarSesion(renovada));
  return respuestaOk(renovada, r.code);
}

/**
 * Crea la función que renueva el token (`renew`) y guarda el nuevo. Comparte la promesa en vuelo:
 * dos llamadas a la vez hacen un solo `renew` (CA10). Un 401 se devuelve como error.
 */
export function crearRenovadorSesion(): RenovarSesion {
  let enVuelo: Promise<HttpResponse<IResponseSesion>> | null = null;
  return (repo, almacen, sesion) => {
    if (!enVuelo) {
      enVuelo = renovar(repo, almacen, sesion).finally(() => {
        enVuelo = null;
      });
    }
    return enVuelo;
  };
}
