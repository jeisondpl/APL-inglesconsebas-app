import type { EstadoSesion } from '../entities/Sesion.entities';

/**
 * Estado observable de la sesión en memoria. Lo crea el contenedor y lo comparten el cliente HTTP
 * (token y 401) y React (useSyncExternalStore).
 */
export interface SesionActiva {
  obtener(): EstadoSesion;
  /** Token de la sesión, solo con el estado `autenticado`. */
  token(): string | null;
  establecer(estado: EstadoSesion): void;
  /**
   * Marca la sesión actual como «cerrándose». `token()` sigue devolviendo su token (el logout sale
   * con ese Bearer), pero deja de ser vigente: ningún `me`/`renew` tardío puede guardarla ni
   * publicarla. Lo anula el siguiente `establecer`.
   */
  iniciarCierre(): void;
  /** `true` si hay sesión autenticada con ese token y no se está cerrando. */
  esVigente(token: string): boolean;
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}
