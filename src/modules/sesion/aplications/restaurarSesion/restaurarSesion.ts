import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

import type { IResponseSesion } from '../../domain/entities/Sesion.entities';
import {
  CLAVE_SESION,
  leerSesionGuardada,
  sesionVencida,
} from '../../domain/validations/sesion.validations';

/**
 * Lee la sesión guardada sin tocar la red. Si no hay, está corrupta o ya venció, la borra y
 * devuelve `null`; si sigue vigente, la devuelve (también sin conexión, CA8).
 */
export async function restaurarSesionUseCase(
  almacen: SecureStoragePort,
  ahora: Date,
): Promise<IResponseSesion | null> {
  const texto = await almacen.leer(CLAVE_SESION);
  if (texto === null) {
    return null;
  }
  const guardada = leerSesionGuardada(texto);
  if (!guardada || sesionVencida(guardada, ahora)) {
    await almacen.borrar(CLAVE_SESION);
    return null;
  }
  const { token, expiraEn, renovarDesde, usuario } = guardada;
  return { token, expiraEn, renovarDesde, usuario };
}
