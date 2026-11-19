/**
 * Entidades del inicio del estudiante (F1-05). Fechas `Y-m-d` y horas `HH:mm` en la hora de
 * Bogotá, tal como las guarda Leap; los cálculos con el instante actual están en las validaciones.
 */

export interface IArgsResumenInicio {
  /** students.id del estudiante de la sesión. */
  idEstudiante: string;
}

/** Ciclo de facturación actual (auth.php `student.cycle`). */
export interface ICicloEstudiante {
  inicio: string;
  fin: string;
}

/** Plan, ciclo y cancelaciones del estudiante (auth.php?action=me). */
export interface IResponsePlanEstudiante {
  /** Paquete tal cual lo guarda Leap (`Essential`, `Power⚡`, `Flex8🎯`…). */
  plan: string | null;
  ciclo: ICicloEstudiante | null;
  /** Tokens gastados en el ciclo. */
  cancelacionesUsadas: number;
  /** Tokens del plan. */
  cancelacionesMaximas: number;
}

/** Una fila de class_sessions. */
export interface IResponseSesionClase {
  id: string;
  fecha: string;
  hora: string;
  /** `class_sessions.status` (scheduled, taken, rescheduled…). */
  estado: string;
  cuentaComoTomada: boolean;
  inicioCiclo: string | null;
  finCiclo: string | null;
  /** Fecha y hora nuevas de una clase reagendada. */
  fechaNueva: string | null;
  horaNueva: string | null;
  profe: string | null;
  enlaceZoom: string | null;
}

/** Franja del horario fijo (student_schedule). */
export interface IResponseFranjaHorario {
  /** 1 = lunes … 7 = domingo (ISO, como `day_of_week`). */
  diaSemana: number;
  hora: string;
  duracionMin: number | null;
}

export interface IResponseTarea {
  id: string;
  titulo: string;
  /** pending, ready_review, reviewed… */
  estado: string;
  venceEl: string | null;
}

export type AdjuntoMensaje = 'imagen' | 'voz' | null;

export interface IResponseMensaje {
  id: string;
  remitente: string;
  deEstudiante: boolean;
  texto: string;
  adjunto: AdjuntoMensaje;
  /** `Y-m-d H:i:s` del servidor. */
  enviadoEl: string;
}

/** Próxima clase lista para pintar. */
export interface IProximaClase {
  id: string;
  fecha: string;
  hora: string;
  /** Instante de inicio en milisegundos (UTC). */
  inicioMs: number;
  profe: string | null;
  enlaceZoom: string | null;
  duracionMin: number | null;
  reagendada: boolean;
}

export type CuentaAtras =
  | { tipo: 'ahora' }
  | { tipo: 'minutos'; valor: number }
  | { tipo: 'horas'; valor: number }
  | { tipo: 'dias'; valor: number };

export interface IProgresoCiclo {
  tomadas: number;
  /** `null` si el plan no está en las reglas conocidas. */
  total: number | null;
  /** 0 … 1. */
  fraccion: number;
}

export interface ICancelaciones {
  disponibles: number;
  maximas: number;
  /** Antelación con la que hay que avisar (12 h, o 24 h en Flex). */
  horasAviso: number;
}

/** Resultado de una sección: el inicio pinta lo que llegó aunque otra sección falle. */
export type Seccion<T> = { ok: true; datos: T } | { ok: false; msg: string };

export interface IResumenInicio {
  plan: Seccion<IResponsePlanEstudiante>;
  clases: Seccion<IResponseSesionClase[]>;
  horario: Seccion<IResponseFranjaHorario[]>;
  tareas: Seccion<IResponseTarea[]>;
  noLeidos: Seccion<number>;
  mensajes: Seccion<IResponseMensaje[]>;
}
