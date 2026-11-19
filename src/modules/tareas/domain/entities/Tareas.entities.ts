/** Estado que guarda Leap: la tarea se entrega y luego la revisa la profe. */
export type EstadoTarea = 'pending' | 'ready_review' | 'reviewed';

/** Una tarea tal como la entrega Leap (sin voz ni imágenes: solo banderas; se piden aparte). */
export interface IResponseTarea {
  id: number;
  idEstudiante: string;
  /** Nombre del estudiante (la profe lo necesita para saber de quién es). */
  estudiante: string | null;
  titulo: string;
  instruccion: string;
  tema: string | null;
  /** `Y-m-d` o `null` si no tiene fecha. */
  vence: string | null;
  estado: EstadoTarea;
  personalizada: boolean;
  entrega: string | null;
  entregadaEn: string | null;
  comentario: string | null;
  nota: string | null;
  revisadaEn: string | null;
  feedbackVisto: boolean;
  creada: string;
  tieneVozInstruccion: boolean;
  tieneVozEntrega: boolean;
  tieneVozFeedback: boolean;
  imagenesInstruccion: number;
  imagenesEntrega: number;
  /** PDFs adjuntos (solo se ven en la web). */
  archivos: number;
}

export interface IResponseListaTareas {
  tareas: IResponseTarea[];
  pendientes: number;
  porRevisar: number;
  feedbackNuevo: number;
}

/** De qué parte de la tarea se pide el contenido. */
export type SlotTarea = 'instruccion' | 'entrega' | 'feedback';

export interface IResponseMediaTarea {
  /** `data:audio/...;base64,...` o `null`. */
  voz: string | null;
  imagenes: string[];
}

export interface IArgsEntregar {
  id: number;
  texto: string;
  /** Nota de voz grabada (data URL), opcional. */
  voz?: string;
}

export interface IArgsRevisar {
  id: number;
  comentario: string;
  nota: string;
  voz?: string;
}

/** Sección de la lista. El estudiante usa las tres; la profe, «por revisar» y «revisadas». */
export type SeccionTareas = 'pendientes' | 'porRevisar' | 'revisadas';
