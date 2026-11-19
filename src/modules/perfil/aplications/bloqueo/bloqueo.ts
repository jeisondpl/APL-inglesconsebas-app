import type { BiometriaPort } from '@/native/ports/BiometriaPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { CLAVE_BLOQUEO_BIOMETRICO, type Bloqueo } from '@/shared/lib/bloqueo';

export type ResultadoActivarBloqueo =
  | 'activado'
  | 'cancelado'
  | 'no_disponible';

/**
 * Activa el desbloqueo con huella o rostro (1.13): comprueba que el equipo lo permite y que la
 * persona se verifica una vez; solo entonces lo recuerda. No bloquea la app en ese momento.
 */
export async function activarBloqueoUseCase(
  biometria: BiometriaPort,
  almacen: SecureStoragePort,
  bloqueo: Bloqueo,
): Promise<ResultadoActivarBloqueo> {
  const r = await biometria.activar();
  if (r.tipo !== 'ok') {
    return r.tipo;
  }
  await almacen.guardar(CLAVE_BLOQUEO_BIOMETRICO, '1');
  bloqueo.establecerActivo(true);
  return 'activado';
}

export async function desactivarBloqueoUseCase(
  biometria: BiometriaPort,
  almacen: SecureStoragePort,
  bloqueo: Bloqueo,
): Promise<void> {
  await biometria.desactivar();
  await almacen.borrar(CLAVE_BLOQUEO_BIOMETRICO);
  bloqueo.establecerActivo(false);
}
