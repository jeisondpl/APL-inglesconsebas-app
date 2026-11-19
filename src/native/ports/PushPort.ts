export type PlataformaPush = 'android' | 'ios';

export type ResultadoRegistroPush =
  | { tipo: 'ok'; token: string; plataforma: PlataformaPush }
  /** La persona no dio permiso para notificaciones. */
  | { tipo: 'denegado' }
  /** Sin Firebase configurado en esta compilación (falta google-services.json) o sin servicios de Google. */
  | { tipo: 'no_disponible' };

/** Aviso que abrió la app o la devolvió al primer plano: `tipo` e `id` salen del `data` del push. */
export interface IAvisoAbierto {
  tipo: string;
  id: number | null;
}

/** Notificaciones push (FCM). Nunca rechaza: un fallo vuelve como `no_disponible`. */
export interface PushPort {
  /** Pide permiso (Android 13+, iOS) y devuelve el token FCM del dispositivo. */
  registrar(): Promise<ResultadoRegistroPush>;
  /** Avisa cuando FCM rota el token. Devuelve la función para dejar de escuchar. */
  alRenovarToken(
    escuchar: (token: string, plataforma: PlataformaPush) => void,
  ): () => void;
  /**
   * Avisa cuando la persona toca una notificación: con la app en segundo plano o cerrada (en ese caso
   * se entrega el aviso que la abrió, una sola vez). Devuelve la función para dejar de escuchar.
   */
  alAbrirAviso(escuchar: (aviso: IAvisoAbierto) => void): () => void;
}
