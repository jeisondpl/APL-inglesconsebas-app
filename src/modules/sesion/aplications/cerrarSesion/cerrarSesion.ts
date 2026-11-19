import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaOk, type HttpResponse } from '@/shared/lib/HttpResponse';

import type { SesionRepository } from '../../domain/models/SesionRepository';
import {
  CLAVE_SESION,
  LIMITE_CIERRE_REMOTO_MS,
} from '../../domain/validations/sesion.validations';

/**
 * Cierra la sesión: avisa al servidor (`logout`), esperando como mucho `limiteMs`, y borra el
 * almacén. Siempre termina bien: sin red o con error del servidor, la sesión se cierra en local.
 */
export async function cerrarSesionUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  limiteMs: number = LIMITE_CIERRE_REMOTO_MS,
): Promise<HttpResponse<void>> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const espera = new Promise<void>(resolver => {
    temporizador = setTimeout(resolver, limiteMs);
  });
  try {
    await Promise.race([repo.cerrarSesion().catch(() => undefined), espera]);
  } finally {
    clearTimeout(temporizador);
  }
  await almacen.borrar(CLAVE_SESION);
  return respuestaOk<void>(undefined);
}
