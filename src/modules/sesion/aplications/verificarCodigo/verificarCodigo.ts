import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsVerificarCodigo,
  IResponseReenvio,
  IResponseSesion,
} from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { validarCodigo } from '../../domain/validations/sesion.validations';
import { guardarSesionNueva } from '../iniciarSesion/iniciarSesion';

/**
 * Segundo paso del login (F1-06): el código de 6 dígitos que llegó por correo. Valida, lo envía
 * con el desafío y guarda la sesión que crea el servidor. El código no se guarda nunca.
 */
export async function verificarCodigoUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  args: IArgsVerificarCodigo,
): Promise<HttpResponse<IResponseSesion>> {
  const invalido = validarCodigo(args.codigo);
  if (invalido) {
    return respuestaError(invalido);
  }
  return guardarSesionNueva(almacen, await repo.verificarCodigo(args));
}

/** Pide otro código para el mismo desafío (el servidor limita cada cuánto y cuántos). */
export function reenviarCodigoUseCase(
  repo: SesionRepository,
  desafio: string,
): Promise<HttpResponse<IResponseReenvio>> {
  return repo.reenviarCodigo(desafio);
}
