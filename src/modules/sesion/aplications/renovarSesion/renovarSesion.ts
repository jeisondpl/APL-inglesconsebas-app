import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';

import type { IResponseSesion } from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { mensajesSesion } from '../../domain/sesion.mensajes';
import {
  CLAVE_SESION,
  serializarSesion,
} from '../../domain/validations/sesion.validations';

export type RenovarSesion = (
  repo: SesionRepository,
  almacen: SecureStoragePort,
  sesion: IResponseSesion,
  /** Si devuelve false al llegar la respuesta, no se guarda nada (la sesión se cerró o cambió). */
  sigueVigente?: () => boolean,
) => Promise<HttpResponse<IResponseSesion>>;

async function renovar(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  sesion: IResponseSesion,
  sigueVigente: () => boolean,
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
  if (!sigueVigente()) {
    return respuestaError(mensajesSesion.sesionCambio);
  }
  await almacen.guardar(CLAVE_SESION, serializarSesion(renovada));
  return respuestaOk(renovada, r.code);
}

/**
 * Crea la función que renueva el token (`renew`) y guarda el nuevo. Comparte la promesa en vuelo:
 * dos llamadas a la vez hacen un solo `renew` (CA10). Un 401 se devuelve como error.
 */
export function crearRenovadorSesion(): RenovarSesion {
  let enVuelo: Promise<HttpResponse<IResponseSesion>> | null = null;
  return (repo, almacen, sesion, sigueVigente = () => true) => {
    if (!enVuelo) {
      enVuelo = renovar(repo, almacen, sesion, sigueVigente).finally(() => {
        enVuelo = null;
      });
    }
    return enVuelo;
  };
}
