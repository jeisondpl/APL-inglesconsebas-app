/** Abre una URL fuera de la app (navegador, WhatsApp). Nunca rechaza. */
export interface EnlacesPort {
  /** Devuelve `false` si el sistema no pudo abrir la URL. */
  abrir(url: string): Promise<boolean>;
}
