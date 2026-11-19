import type { BiometriaPort } from '@/native/ports/BiometriaPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { CLAVE_BLOQUEO_BIOMETRICO, type Bloqueo } from '@/shared/lib/bloqueo';

/** Pasado este tiempo en segundo plano, la app vuelve a pedir huella o rostro. */
export const SEGUNDOS_PARA_BLOQUEAR = 60;

/**
 * Arranque en frío con sesión (1.13): si la persona había activado el desbloqueo y el equipo aún
 * tiene biometría, la app arranca bloqueada; si ya no la tiene (la quitaron del equipo), se olvida
 * el bloqueo para no dejarla fuera.
 */
export async function arrancarBloqueoUseCase(
  almacen: SecureStoragePort,
  biometria: BiometriaPort,
  bloqueo: Bloqueo,
): Promise<void> {
  const activo = (await almacen.leer(CLAVE_BLOQUEO_BIOMETRICO)) === '1';
  if (activo && (await biometria.disponible())) {
    bloqueo.cargar(true);
    return;
  }
  if (activo) {
    await almacen.borrar(CLAVE_BLOQUEO_BIOMETRICO);
    await biometria.desactivar();
  }
  bloqueo.cargar(false);
}

/** Al cerrar o vencer la sesión se olvida el desbloqueo: es de esa persona, no del equipo. */
export async function olvidarBloqueoUseCase(
  almacen: SecureStoragePort,
  biometria: BiometriaPort,
  bloqueo: Bloqueo,
): Promise<void> {
  bloqueo.cargar(false);
  await almacen.borrar(CLAVE_BLOQUEO_BIOMETRICO);
  await biometria.desactivar();
}

/** ¿Estuvo el tiempo suficiente en segundo plano para volver a pedir la verificación? */
export function debeVolverABloquear(
  salioEnMs: number,
  volvioEnMs: number,
): boolean {
  return volvioEnMs - salioEnMs >= SEGUNDOS_PARA_BLOQUEAR * 1000;
}
