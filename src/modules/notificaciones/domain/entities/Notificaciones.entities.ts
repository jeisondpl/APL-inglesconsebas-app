export type PlataformaDispositivo = 'android' | 'ios';

/** Cuerpo de `devices` (register) de Leap. */
export interface IArgsRegistrarDispositivo {
  token: string;
  plataforma: PlataformaDispositivo;
}

/** Hacia dónde lleva un aviso: la pestaña de la app que lo explica. */
export type DestinoAviso = 'clases' | 'mensajes' | 'tareas';
