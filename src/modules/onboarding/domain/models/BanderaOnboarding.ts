import type { EstadoOnboarding } from '../entities/Onboarding.entities';

/**
 * Estado observable de la bandera `hasSeenOnboarding` en memoria, en paralelo a `SesionActiva`.
 * Lo crea el contenedor y lo comparten el navegador raíz y la pantalla: terminar la bienvenida
 * cambia el flujo por estado, sin `navigate` imperativo.
 */
export interface BanderaOnboarding {
  obtener(): EstadoOnboarding;
  establecer(estado: EstadoOnboarding): void;
  /** Devuelve la función para desuscribirse. */
  suscribir(oyente: () => void): () => void;
}
