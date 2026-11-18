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

// ── Cancelar una clase (F2-02 de la tarjeta F2-01, ítem 2.2) ────────────────────────────────
// El SERVIDOR decide el resultado (cancel_preview / student_cancel en Leap): la App muestra lo que
// pasaría, deja elegir si hay opciones y confirma. Nunca calcula el estado ni los tokens.

/** Qué hacer con la clase cuando el servidor deja elegir. */
export type OpcionCancelacion = 'reagendar' | 'soltar';

/** Qué pasaría, según el servidor. Los textos los pone la App a partir del escenario. */
export type EscenarioCancelacion =
  | 'flex_libera'
  | 'flex_tarde'
  | 'power_tarde'
  | 'power_elige'
  | 'elige'
  | 'reagendar_necesario'
  | 'sin_tokens'
  | 'reagendada';

/** Por qué no se puede cancelar (la App pone el texto). */
export type MotivoNoCancelable =
  | 'no_cancelable'
  | 'ya_empezo'
  | 'ciclo_futuro'
  | 'fecha_invalida';

export interface IOpcionCancelacion {
  opcion: OpcionCancelacion;
  /** Estado en que quedará la clase con esta opción. */
  estado: string;
  descuentaToken: boolean;
}

export type VistaPreviaCancelacion =
  | { puede: false; motivo: MotivoNoCancelable | string }
  | {
      puede: true;
      escenario: EscenarioCancelacion;
      estadoFinal: string;
      opciones: IOpcionCancelacion[];
      descuentaToken: boolean;
      fecha: string;
      hora: string;
      horasRestantes: number;
      tokensUsados: number;
      tokensMaximos: number;
      /** Esta cancelación dejaría al estudiante por debajo del mínimo del ciclo. */
      afectaMinimo: boolean;
      minimo: number;
      /** Hay compañero de grupo: la cancelación también lo afecta. */
      enGrupo: boolean;
    };

export interface IArgsCancelar {
  idClase: string;
  /** Obligatoria si la vista previa trae `opciones`. */
  opcion?: OpcionCancelacion;
}

/** Resultado real, que puede diferir del esperado (p. ej. sin tokens a última hora). */
export interface IResponseCancelacion {
  estadoFinal: string;
}

// ── Reagendar una clase «por reagendar» (ítem 2.3) ──────────────────────────────────────────
// Leap filtra los espacios (profes excluidas o exclusivas, horario habitual, cruces, anticipación y
// plazo) y valida de nuevo al confirmar: la App solo muestra y escoge.

/** Un espacio que el estudiante puede escoger. */
export interface IEspacioReagendar {
  fecha: string;
  hora: string;
  profe: string;
  idProfe: string;
  /** Es su profe asignada: se muestra primero. */
  esMiProfe: boolean;
}

/** Por qué no se puede reagendar (la App pone el texto). */
export type MotivoNoReagendable = 'no_reagendable' | 'vencida' | 'en_grupo';

export type EspaciosReagendar =
  | { puede: false; motivo: MotivoNoReagendable | string }
  | {
      puede: true;
      /** Último día para escoger (`Y-m-d`); `null` si Leap no puso plazo. */
      hasta: string | null;
      fechaOriginal: string;
      anticipacionHoras: number;
      espacios: IEspacioReagendar[];
    };

export interface IArgsReagendar {
  idClase: string;
  fecha: string;
  hora: string;
  idProfe: string;
}
