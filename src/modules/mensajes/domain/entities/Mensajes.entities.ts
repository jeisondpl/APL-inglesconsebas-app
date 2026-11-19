/** Quién escribió: la web del admin también escribe en el hilo del estudiante. */
export type RemitenteChat = 'student' | 'teacher' | 'admin';

/** Emoji → quiénes reaccionaron (`student:<id>` o `teacher:<nombre>`, como en la web). */
export type Reacciones = Record<string, string[]>;

/** Un mensaje del hilo tal como lo entrega Leap (sin voz ni imagen: se piden aparte). */
export interface IResponseMensaje {
  id: number;
  idEstudiante: string;
  remitente: RemitenteChat;
  nombre: string | null;
  texto: string;
  tieneImagen: boolean;
  tieneVoz: boolean;
  /** El otro lado ya lo leyó (en mensajes míos) o yo lo leí (en los suyos). */
  leido: boolean;
  editado: boolean;
  reacciones: Reacciones;
  /** `Y-m-d H:i:s` en hora de Bogotá. */
  creado: string;
  /** Lo escribí yo (lo decide el servidor con la sesión). */
  mio: boolean;
}

/** Lo que cambia sin que cambie el id: «visto» y reacciones de los últimos mensajes. */
export interface IEstadoMensaje {
  id: number;
  leido: boolean;
  editado: boolean;
  reacciones: Reacciones;
}

export interface IResponseHilo {
  mensajes: IResponseMensaje[];
  estados: IEstadoMensaje[];
}

export interface IResponseConversacion {
  idEstudiante: string;
  nombre: string;
  noLeidos: number;
  ultimo: IResponseMensaje | null;
}

export interface IResponseBandeja {
  conversaciones: IResponseConversacion[];
  noLeidos: number;
}

/** Imagen y voz de un mensaje (data URL), pedidas aparte de la lista. */
export interface IResponseMedia {
  imagen: string | null;
  voz: string | null;
  /** Duración de la nota si se conoce (la que acabo de grabar). */
  duracionMs?: number;
}

export interface IArgsHilo {
  idEstudiante: string;
  /** Solo mensajes con id mayor. 0 = los últimos 50. */
  despuesDe: number;
}

export interface IArgsEnviar {
  idEstudiante: string;
  texto: string;
  /** Data URL de la imagen (entrega 3.3). */
  imagen?: string;
  /** Data URL de la nota de voz (entrega 3.2). */
  voz?: string;
}

export interface IArgsReaccion {
  id: number;
  emoji: string;
}

/** De dónde sale la foto que se envía. */
export type OrigenFoto = 'galeria' | 'camara';

/** Estado de envío de un mensaje propio en pantalla. */
export type EnvioMensaje = 'enviando' | 'enviado' | 'fallido';

/** Mensaje en pantalla: los del servidor y los propios que aún no llegan (id negativo). */
export interface IMensajeChat extends IResponseMensaje {
  envio: EnvioMensaje;
  /** Imagen propia aún sin subir: se muestra sin pedirla al servidor. */
  imagenLocal?: string;
  /** Nota de voz propia aún sin subir. */
  vozLocal?: string;
  /** Duración conocida de la nota recién grabada (ms). */
  duracionVozMs?: number;
}

export interface IReaccionResumen {
  emoji: string;
  cantidad: number;
  mia: boolean;
}

export type FilaHilo =
  | { tipo: 'dia'; fecha: string }
  | { tipo: 'mensaje'; mensaje: IMensajeChat };
