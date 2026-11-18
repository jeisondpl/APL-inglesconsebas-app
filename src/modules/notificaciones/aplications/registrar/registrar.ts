import type { PushPort } from '@/native/ports/PushPort';

import type { NotificacionesRepository } from '../../domain/models/NotificacionesRepository';

export type ResultadoRegistro =
  | 'registrado'
  | 'denegado'
  | 'no_disponible'
  | 'error';

/**
 * Pide permiso, toma el token FCM y lo deja a nombre de la sesión en Leap. Nunca lanza: el push es
 * un extra y no debe estorbar al resto de la app.
 */
export async function registrarDispositivoUseCase(
  push: PushPort,
  repo: NotificacionesRepository,
): Promise<ResultadoRegistro> {
  const r = await push.registrar();
  if (r.tipo !== 'ok') {
    return r.tipo;
  }
  const res = await repo.registrarDispositivo({
    token: r.token,
    plataforma: r.plataforma,
  });
  return !res.error ? 'registrado' : 'error';
}

/** Re-registra un token rotado por FCM. */
export async function renovarTokenUseCase(
  repo: NotificacionesRepository,
  token: string,
  plataforma: 'android' | 'ios',
): Promise<boolean> {
  const res = await repo.registrarDispositivo({ token, plataforma });
  return !res.error;
}
