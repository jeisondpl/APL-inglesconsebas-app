export type ResultadoBiometria =
  | { tipo: 'ok' }
  /** La persona canceló o no pasó la verificación. */
  | { tipo: 'cancelado' }
  /** El equipo no tiene huella o rostro configurados. */
  | { tipo: 'no_disponible' };

/** Desbloqueo con huella o rostro (F1-03b, 1.13). Nunca rechaza. */
export interface BiometriaPort {
  /** ¿El equipo tiene biometría configurada? */
  disponible(): Promise<boolean>;
  /** Deja listo el desbloqueo y comprueba que funciona (pide la huella o el rostro una vez). */
  activar(): Promise<ResultadoBiometria>;
  /** Olvida el desbloqueo. */
  desactivar(): Promise<void>;
  /** Pide la huella o el rostro. */
  autenticar(): Promise<ResultadoBiometria>;
}
