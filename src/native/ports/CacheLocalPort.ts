/**
 * Caché local en disco de lo último que bajó de Leap (F1-03b, 1.15), para mostrarlo sin conexión.
 * No es un almacén seguro: no guarda tokens ni PIN, solo respuestas de lectura por persona. Nunca
 * rechaza: un fallo se ve como «no hay dato» o como que no se pudo guardar.
 */
export interface CacheLocalPort {
  /** Texto guardado con `clave`, o `null` si no hay o falla la lectura. */
  leer(clave: string): Promise<string | null>;
  /** Guarda `valor` con `clave`. Si no se puede, no hace nada. */
  guardar(clave: string, valor: string): Promise<void>;
  /** Borra todo lo guardado (al cerrar sesión). */
  limpiar(): Promise<void>;
}
