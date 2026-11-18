export type ResultadoInicioGrabacion =
  | { tipo: 'ok' }
  /** La persona no dio permiso de micrófono. */
  | { tipo: 'denegado' }
  | { tipo: 'error'; msg: string };

export type ResultadoGrabacion =
  | {
      tipo: 'ok';
      /** `data:audio/...;base64,...` listo para enviar. */
      dataUrl: string;
      duracionMs: number;
    }
  | { tipo: 'error'; msg: string };

export type ResultadoReproduccion =
  | { tipo: 'ok' }
  | { tipo: 'error'; msg: string };

export interface IOpcionesReproduccion {
  /** Identifica la nota: se guarda en caché con esa clave para no reescribirla. */
  clave: string;
  /** Posición y duración en milisegundos. */
  alProgreso: (posicionMs: number, duracionMs: number) => void;
  /** Terminó, la detuvo la persona o empezó otra nota. */
  alTerminar: () => void;
}

/** Graba y reproduce notas de voz. Nunca rechaza: un fallo vuelve como `error`. */
export interface AudioPort {
  /** Pide el permiso si hace falta y empieza a grabar. `alProgreso` recibe los ms grabados. */
  empezarGrabacion(
    alProgreso: (ms: number) => void,
  ): Promise<ResultadoInicioGrabacion>;
  /** Termina la grabación y la entrega como data URL. */
  terminarGrabacion(): Promise<ResultadoGrabacion>;
  /** Descarta la grabación en curso. */
  cancelarGrabacion(): Promise<void>;
  /** Reproduce una nota (data URL). Solo suena una a la vez. */
  reproducir(
    dataUrl: string,
    opciones: IOpcionesReproduccion,
  ): Promise<ResultadoReproduccion>;
  detener(): Promise<void>;
}
