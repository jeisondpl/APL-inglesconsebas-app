import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

import type { SesionActiva } from '../../domain/models/SesionActiva';
import { CLAVE_SESION } from '../../domain/validations/sesion.validations';

/**
 * Lo llama el cliente HTTP ante un 401. Solo actúa con una sesión activa: el 401 del propio login
 * (credenciales) no cambia nada. Con `tokenPeticion`, solo actúa si es el token de la sesión activa:
 * el 401 tardío de una sesión anterior no invalida la actual. Pasa a `sinSesion` con motivo
 * `vencida` y borra el almacén.
 */
export async function invalidarSesionUseCase(
  almacen: SecureStoragePort,
  sesionActiva: SesionActiva,
  tokenPeticion?: string | null,
): Promise<void> {
  if (sesionActiva.obtener().tipo !== 'autenticado') {
    return;
  }
  if (tokenPeticion !== undefined && tokenPeticion !== sesionActiva.token()) {
    return;
  }
  sesionActiva.establecer({ tipo: 'sinSesion', motivo: 'vencida' });
  await almacen.borrar(CLAVE_SESION);
}
