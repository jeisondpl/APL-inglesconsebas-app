import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsIniciarSesion,
  IResponseRenovacion,
  IResponseSesion,
  IResponseUsuarioActual,
} from '../entities/Sesion.entities';

/** Puerto remoto de la sesión (auth.php de Leap). El token lo pone el cliente HTTP. */
export interface SesionRepository {
  /** Login con usuario y PIN. */
  iniciarSesion(
    args: IArgsIniciarSesion,
  ): Promise<HttpResponse<IResponseSesion>>;
  /** Valida la sesión actual (`me`) con el Bearer del cliente. */
  obtenerUsuarioActual(): Promise<HttpResponse<IResponseUsuarioActual>>;
  /** Cambia el token actual por uno nuevo (`renew`). */
  renovar(): Promise<HttpResponse<IResponseRenovacion>>;
  /** Revoca la sesión en el servidor (`logout`). Idempotente. */
  cerrarSesion(): Promise<HttpResponse<void>>;
}
