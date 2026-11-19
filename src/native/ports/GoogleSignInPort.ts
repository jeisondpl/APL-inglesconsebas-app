/** Resultado del selector de cuentas de Google. `cancelado` no es un error: no se muestra nada. */
export type ResultadoIdTokenGoogle =
  | { tipo: 'ok'; idToken: string }
  | { tipo: 'cancelado' }
  | { tipo: 'error'; mensaje: string };

/** Inicio de sesión nativo con Google (F1-06). Nunca rechaza. */
export interface GoogleSignInPort {
  /** `false` si el build no tiene GOOGLE_WEB_CLIENT_ID: el botón no se muestra. */
  disponible: boolean;
  /** Abre el selector de cuentas y devuelve el ID token para Leap. */
  obtenerIdToken(): Promise<ResultadoIdTokenGoogle>;
  /** Olvida la cuenta elegida para que la próxima vez se pueda elegir otra. Best-effort. */
  cerrarSesion(): Promise<void>;
}
