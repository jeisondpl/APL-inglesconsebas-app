import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type { IArgsRegistrarDispositivo } from '../entities/Notificaciones.entities';

/** Puerto remoto de los dispositivos push (endpoint `devices` de Leap, F1-02). */
export interface NotificacionesRepository {
  /** Deja el dispositivo a nombre de la sesión actual. Idempotente por token. */
  registrarDispositivo(
    args: IArgsRegistrarDispositivo,
  ): Promise<HttpResponse<void>>;
}
