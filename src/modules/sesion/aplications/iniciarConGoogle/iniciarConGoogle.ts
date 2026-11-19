import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';

import type { IResponseSesion } from '../../domain/entities/Sesion.entities';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { guardarSesionNueva } from '../iniciarSesion/iniciarSesion';

/** Resultado del login con Google: `cancelado` si la persona cerró el selector (no es un error). */
export type ResultadoGoogle =
  | { tipo: 'cancelado' }
  | { tipo: 'respuesta'; respuesta: HttpResponse<IResponseSesion> };

/**
 * Login con Google (F1-06): el selector nativo da el ID token, Leap lo verifica y entra con la
 * persona de ese correo. Si Leap lo rechaza, se cierra la sesión de Google del teléfono para que
 * el siguiente intento deje elegir otra cuenta.
 */
export async function iniciarConGoogleUseCase(
  repo: SesionRepository,
  almacen: SecureStoragePort,
  google: GoogleSignInPort,
): Promise<ResultadoGoogle> {
  const token = await google.obtenerIdToken();
  if (token.tipo === 'cancelado') {
    return { tipo: 'cancelado' };
  }
  if (token.tipo === 'error') {
    return { tipo: 'respuesta', respuesta: respuestaError(token.mensaje) };
  }
  const r = await guardarSesionNueva(
    almacen,
    await repo.iniciarConGoogle(token.idToken),
  );
  if (r.error) {
    await google.cerrarSesion();
  }
  return { tipo: 'respuesta', respuesta: r };
}
