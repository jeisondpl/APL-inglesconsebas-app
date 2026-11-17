/**
 * Almacén cifrado del sistema (Keychain en iOS, Keystore en Android) para datos sensibles como el
 * token de sesión. Nunca rechaza: los fallos se devuelven como `null` o `false`.
 */
export interface SecureStoragePort {
  /** Valor guardado con `clave`, o `null` si no hay o si falla la lectura. */
  leer(clave: string): Promise<string | null>;
  /** Guarda `valor` con `clave`. Devuelve `false` si no se pudo guardar. */
  guardar(clave: string, valor: string): Promise<boolean>;
  /** Borra el valor de `clave`. Si no existe o falla, no hace nada. */
  borrar(clave: string): Promise<void>;
}
