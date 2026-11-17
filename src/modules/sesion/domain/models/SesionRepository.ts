import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsIniciarSesion,
  IArgsVerificarCodigo,
  IResponseReenvio,
  IResponseRenovacion,
  IResponseSesion,
  IResponseUsuarioActual,
  ResultadoLogin,
} from '../entities/Sesion.entities';

/** Puerto remoto de la sesión (auth.php de Leap). El token lo pone el cliente HTTP. */
export interface SesionRepository {
  /** Login con usuario y PIN. Con correo registrado devuelve el desafío del código (F1-06). */
  iniciarSesion(
    args: IArgsIniciarSesion,
  ): Promise<HttpResponse<ResultadoLogin>>;
  /** Segundo paso: el código que llegó por correo. Crea la sesión. */
  verificarCodigo(
    args: IArgsVerificarCodigo,
  ): Promise<HttpResponse<IResponseSesion>>;
  /** Pide otro código para el mismo desafío. */
  reenviarCodigo(desafio: string): Promise<HttpResponse<IResponseReenvio>>;
  /** Login con el ID token de Google (sin código: Google ya es el segundo factor). */
  iniciarConGoogle(idToken: string): Promise<HttpResponse<IResponseSesion>>;
  /** Valida la sesión actual (`me`) con el Bearer del cliente. */
  obtenerUsuarioActual(): Promise<HttpResponse<IResponseUsuarioActual>>;
  /** Cambia el token actual por uno nuevo (`renew`). */
  renovar(): Promise<HttpResponse<IResponseRenovacion>>;
  /** Revoca la sesión en el servidor (`logout`). Idempotente. */
  cerrarSesion(): Promise<HttpResponse<void>>;
}
