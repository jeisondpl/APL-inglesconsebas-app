/** Fila de GET class_sessions&student_id (solo lo que usa Clases). */
export interface ILeapClase {
  id?: number | string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  status?: string | null;
  counts_as_taken?: number | string | boolean | null;
  class_number?: number | string | null;
  cycle_start?: string | null;
  cycle_end?: string | null;
  new_date?: string | null;
  new_time?: string | null;
  teacher_name?: string | null;
  teacher_zoom_url?: string | null;
}

/** Respuesta de POST class_sessions {action:'cancel_preview'} (cancelacion.php de Leap). */
export interface ILeapVistaPrevia {
  puede?: boolean;
  motivo?: string;
  escenario?: string;
  estadoFinal?: string;
  opciones?: { opcion?: string; estado?: string; descuentaToken?: boolean }[];
  descuentaToken?: boolean;
  fecha?: string;
  hora?: string;
  horasRestantes?: number | string;
  tokensUsados?: number | string;
  tokensMaximos?: number | string;
  afectaMinimo?: boolean;
  minimo?: number | string;
  enGrupo?: boolean;
}

/** Respuesta de POST class_sessions {action:'student_cancel'}. */
export interface ILeapCancelacion {
  ok?: boolean;
  finalStatus?: string;
}

/** Respuesta de POST class_sessions {action:'reschedule_slots'} (reagendar.php de Leap). */
export interface ILeapEspacios {
  puede?: boolean;
  motivo?: string;
  hasta?: string | null;
  fechaOriginal?: string;
  anticipacionHoras?: number | string;
  espacios?: {
    fecha?: string;
    hora?: string;
    profe?: string;
    idProfe?: string;
    esMiProfe?: boolean;
  }[];
}
