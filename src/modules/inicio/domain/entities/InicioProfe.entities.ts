/**
 * Entidades del inicio del profe (F1-07, ítem 1.18): clases de hoy y pendientes. Fechas `Y-m-d` y
 * horas `HH:mm` en la hora de Bogotá, como las guarda Leap.
 */
import type { Seccion } from './Inicio.entities';

export interface IArgsInicioProfe {
  /** teachers.id del profe de la sesión. */
  idProfe: string;
}

/**
 * Una fila de class_sessions con lo que el profe necesita. Fecha, hora y profe ya son los
 * EFECTIVOS: los de la reprogramación (`new_*`) si existen, como hace la web.
 */
export interface IResponseClaseProfe {
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

/** Estudiante activo de Leap (solo id y nombre: el resto no se usa en el inicio). */
export interface IResponseEstudianteProfe {
  id: string;
  nombre: string;
}

/** Clase ya dada sin asistencia marcada (pending_attendance). */
export interface IResponseAsistenciaPendiente {
  id: string;
  estudiante: string;
  fecha: string;
  hora: string;
}

/** Tarea entregada por un estudiante, esperando la revisión del profe. */
export interface IResponseTareaRevision {
  id: string;
  titulo: string;
  estudiante: string;
  /** pending, ready_review, reviewed… */
  estado: string;
}

export interface IResumenInicioProfe {
  clases: Seccion<IResponseClaseProfe[]>;
  estudiantes: Seccion<IResponseEstudianteProfe[]>;
  asistencias: Seccion<IResponseAsistenciaPendiente[]>;
  tareas: Seccion<IResponseTareaRevision[]>;
  noLeidos: Seccion<number>;
}

/** En qué punto está una clase de hoy respecto a ahora. */
export type MomentoClase =
  | 'proxima'
  | 'en_curso'
  | 'por_marcar'
  | 'tomada'
  | 'no_asistio';

/** Clase de hoy lista para pintar. */
export interface IClaseHoy {
  id: string;
  hora: string;
  estudiante: string;
  momento: MomentoClase;
  enlaceZoom: string | null;
  numeroClase: number | null;
  /** Instante de inicio (ms UTC). */
  inicioMs: number;
}
