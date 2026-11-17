import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaOk, type HttpResponse } from '@/shared/lib/HttpResponse';

import type { IResponseSesion } from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import {
  CLAVE_SESION,
  serializarSesion,
} from '../../domain/validations/sesion.validations';

/**
 * Valida la sesión con `me`. Con 2xx fusiona el usuario y la nueva expiración y los guarda. Sin red
 * o con un error del servidor conserva la sesión tal cual. Con 401 devuelve el error: la limpieza
 * la hace `alNoAutorizado` del cliente HTTP.
 */
export async function validarSesionUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  sesion: IResponseSesion,
): Promise<HttpResponse<IResponseSesion>> {
  const r = await repo.obtenerUsuarioActual();
  if (r.code === 401) {
    return { error: true, msg: r.msg, code: 401 };
  }
  if (r.error || !r.response) {
    return respuestaOk(sesion);
  }
  const { usuario, expiraEn } = r.response;
  const actualizada: IResponseSesion = {
    ...sesion,
    expiraEn,
    usuario: { ...usuario, usuario: usuario.usuario || sesion.usuario.usuario },
  };
  await almacen.guardar(CLAVE_SESION, serializarSesion(actualizada));
  return respuestaOk(actualizada, r.code);
}
