export type OrigenImagen = 'galeria' | 'camara';

export type ResultadoImagen =
  | {
      tipo: 'ok';
      /** `data:image/...;base64,...`, ya reducida para no pesar en el envío. */
      dataUrl: string;
    }
  | { tipo: 'cancelado' }
  | { tipo: 'error'; msg: string };

/** Elige o toma una foto. Nunca rechaza: un fallo vuelve como `error`. */
export interface SelectorImagenPort {
  elegir(origen: OrigenImagen): Promise<ResultadoImagen>;
}
