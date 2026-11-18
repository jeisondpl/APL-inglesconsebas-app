/**
 * Entidades de la agenda del profe (F2-02, ítems 2.5 y 2.6): su horario por día y por semana, y
 * marcar la asistencia. Fechas `Y-m-d` y horas `HH:mm` en la hora de Bogotá, como las guarda Leap.
 */

export interface IArgsAgenda {
  /** teachers.id del profe de la sesión. */
  idProfe: string;
}

/**
 * Una fila de class_sessions con lo que el profe necesita. Fecha, hora y profe ya son los
 * EFECTIVOS: los de la reprogramación (`new_*`) si existen, como hace la web.
 */
export interface IResponseClaseAgenda {
  id: string;
  idEstudiante: string;
  fecha: string;
  hora: string;
  /** Profe que da la clase (el sustituto si lo hay). */
  idProfe: string;
  /** `class_sessions.status`. */
  estado: string;
  numeroClase: number | null;
  enlaceZoom: string | null;
}

/** Estudiante de Leap (solo id y nombre: `class_sessions` no trae el nombre). */
export interface IResponseEstudianteAgenda {
  id: string;
  nombre: string;
}

/** En qué punto está una clase respecto a ahora, o cómo quedó si ya se marcó. */
export type MomentoClase =
  | 'proxima'
  | 'en_curso'
  | 'por_marcar'
  | 'tomada'
  | 'no_asistio';

/** Una clase de la agenda, lista para pintar. */
export interface IClaseAgenda {
  id: string;
  fecha: string;
  hora: string;
  estudiante: string;
  estado: string;
  momento: MomentoClase;
  numeroClase: number | null;
  enlaceZoom: string | null;
  /** Instante de inicio (ms UTC). */
  inicioMs: number;
}

/** Un día de la semana con sus conteos. */
export interface IDiaSemana {
  fecha: string;
  esHoy: boolean;
  total: number;
  /** Clases que ya empezaron y siguen sin marca. */
  sinMarcar: number;
}

/** Cómo se marca una clase. */
export type MarcaAsistencia = 'taken' | 'no_show';

export interface IArgsMarcar {
  idClase: string;
  marca: MarcaAsistencia;
}
