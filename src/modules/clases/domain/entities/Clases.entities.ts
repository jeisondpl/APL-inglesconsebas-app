/**
 * Entidades de Clases del estudiante (F2-01, ítem 2.1: historial del ciclo con su estado). Fechas
 * `Y-m-d` y horas `HH:mm` en la hora de Bogotá, tal como las guarda Leap.
 */

export interface IArgsClases {
  /** students.id del estudiante de la sesión. */
  idEstudiante: string;
}

/** Una fila de class_sessions del estudiante. */
export interface IResponseClase {
  id: string;
  fecha: string;
  hora: string;
  /** `class_sessions.status`. */
  estado: string;
  cuentaComoTomada: boolean;
  /** Número de clase dentro del ciclo; `null` en los estados que lo pierden (*no_impact*). */
  numeroClase: number | null;
  inicioCiclo: string | null;
  finCiclo: string | null;
  /** Fecha y hora nuevas de una clase reagendada. */
  fechaNueva: string | null;
  horaNueva: string | null;
  profe: string | null;
  enlaceZoom: string | null;
}

export type TonoEstado = 'exito' | 'aviso' | 'peligro' | 'neutra';

/** Cómo se muestra un `class_sessions.status`. */
export interface IEstadoVisible {
  etiqueta: string;
  tono: TonoEstado;
}

/** Una clase del historial, con su fecha efectiva ya resuelta. */
export interface IClaseHistorial {
  id: string;
  /** La fecha y hora en que de verdad es: la nueva si se reagendó. */
  fecha: string;
  hora: string;
  /** Fecha original, solo si se reagendó. */
  fechaOriginal: string | null;
  estado: string;
  numeroClase: number | null;
  profe: string | null;
  enlaceZoom: string | null;
  /** Instante de inicio (ms UTC); `null` si la fecha no es válida. */
  inicioMs: number | null;
}

export interface IResumenCiclo {
  tomadas: number;
  programadas: number;
  porReagendar: number;
  canceladas: number;
}

export interface ICicloClases {
  /** `inicio|fin`, estable entre cargas. */
  id: string;
  inicio: string | null;
  fin: string | null;
  /** El ciclo que contiene el día de hoy. */
  esActual: boolean;
  clases: IClaseHistorial[];
  resumen: IResumenCiclo;
  /** La próxima clase de este ciclo (la primera programada que aún no pasó), si la hay. */
  proximaId: string | null;
}
