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
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}
