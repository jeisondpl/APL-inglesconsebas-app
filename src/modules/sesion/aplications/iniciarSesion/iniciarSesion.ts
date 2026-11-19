import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsIniciarSesion,
  IResponseSesion,
  ResultadoLogin,
} from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { mensajesSesion } from '../../domain/sesion.mensajes';
import {
  CLAVE_SESION,
  esDesafio,
  normalizarUsuario,
  serializarSesion,
  validarPin,
  validarUsuario,
} from '../../domain/validations/sesion.validations';

/**
 * Guarda la sesión recién creada en el almacén seguro (P9): si no se puede, el login falla, porque
 * no se entra con una sesión que no se pueda recordar. Lo comparten PIN, código y Google.
 */
export async function guardarSesionNueva(
  almacen: SecureStoragePort,
  r: HttpResponse<IResponseSesion>,
): Promise<HttpResponse<IResponseSesion>> {
  if (r.error || !r.response) {
    return r;
  }
  const guardada = await almacen.guardar(
    CLAVE_SESION,
    serializarSesion(r.response),
  );
  return guardada ? r : respuestaError(mensajesSesion.noSeGuardo);
}

/**
 * Login con usuario y PIN. Valida y normaliza, llama al servidor y guarda la sesión en el almacén
 * seguro. Si no se puede guardar, falla (P9): no se entra con una sesión que no se pueda recordar.
 * El PIN solo viaja en la petición: no se guarda ni se devuelve. Si la persona tiene correo, el
 * servidor responde con el desafío del código (F1-06): no hay sesión que guardar todavía.
 */
export async function iniciarSesionUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  args: IArgsIniciarSesion,
): Promise<HttpResponse<ResultadoLogin>> {
  const invalido = validarUsuario(args.usuario) ?? validarPin(args.pin);
  if (invalido) {
    return respuestaError(invalido);
  }
  const r = await repo.iniciarSesion({
    usuario: normalizarUsuario(args.usuario),
    pin: args.pin,
  });
  if (r.error || !r.response || esDesafio(r.response)) {
    return r;
  }
  return guardarSesionNueva(almacen, r as HttpResponse<IResponseSesion>);
}
