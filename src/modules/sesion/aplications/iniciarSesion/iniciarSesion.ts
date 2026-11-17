import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsIniciarSesion,
  IResponseSesion,
} from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { mensajesSesion } from '../../domain/sesion.mensajes';
import {
  CLAVE_SESION,
  normalizarUsuario,
  serializarSesion,
  validarPin,
  validarUsuario,
} from '../../domain/validations/sesion.validations';

/**
 * Login con usuario y PIN. Valida y normaliza, llama al servidor y guarda la sesión en el almacén
 * seguro. Si no se puede guardar, falla (P9): no se entra con una sesión que no se pueda recordar.
 * El PIN solo viaja en la petición: no se guarda ni se devuelve.
 */
export async function iniciarSesionUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  args: IArgsIniciarSesion,
): Promise<HttpResponse<IResponseSesion>> {
  const invalido = validarUsuario(args.usuario) ?? validarPin(args.pin);
  if (invalido) {
    return respuestaError(invalido);
  }
  const r = await repo.iniciarSesion({
    usuario: normalizarUsuario(args.usuario),
    pin: args.pin,
  });
  if (r.error || !r.response) {
    return r;
  }
  const guardada = await almacen.guardar(
    CLAVE_SESION,
    serializarSesion(r.response),
  );
  return guardada ? r : respuestaError(mensajesSesion.noSeGuardo);
}
