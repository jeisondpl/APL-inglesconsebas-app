/**
 * Tipos crudos de la API de Leap (rama F1-02) que lee el inicio. Solo se tipan los campos que se
 * usan. PDO puede devolver números como texto: por eso muchos campos aceptan los dos.
 */
type NumeroLeap = number | string | null;

/** GET auth.php?action=me → `student`. */
export interface ILeapEstudianteMe {
  pkg?: string | null;
  tokensUsed?: NumeroLeap;
  tokensMax?: NumeroLeap;
  cycle?: { start?: string | null; end?: string | null } | null;
}

export interface ILeapMeInicio {
  role?: string;
  student?: ILeapEstudianteMe;
}

/** GET api.php?endpoint=class_sessions&student_id=… (una fila). */
export interface ILeapSesionClase {
  id: NumeroLeap;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  status?: string | null;
  counts_as_taken?: NumeroLeap;
  cycle_start?: string | null;
  cycle_end?: string | null;
  new_date?: string | null;
  new_time?: string | null;
  teacher_name?: string | null;
  teacher_zoom_url?: string | null;
}

/** GET api.php?endpoint=schedule&student_id=… (una fila). */
export interface ILeapFranjaHorario {
  day_of_week?: NumeroLeap;
  class_time?: string | null;
  duration_minutes?: NumeroLeap;
}

/** GET api.php?endpoint=tasks&student_id=… (una fila). */
export interface ILeapTarea {
  id: NumeroLeap;
  title?: string | null;
  status?: string | null;
  due_date?: string | null;
}

/** POST api.php?endpoint=chispa {action:'get_unread'}. */
export interface ILeapNoLeidos {
  unread?: NumeroLeap;
}

/** POST api.php?endpoint=chispa {action:'get_thread'} (una fila). */
export interface ILeapMensaje {
  id: NumeroLeap;
  sender?: string | null;
  sender_name?: string | null;
  message?: string | null;
  image_data?: string | null;
  voice_data?: string | null;
  created_at?: string | null;
}

// ── Inicio del profe (F1-07) ────────────────────────────────────

/** Fila de GET class_sessions&all_teacher=1 (sin nombre del estudiante: va por student_id). */
export interface ILeapClaseProfe {
  id?: number | string | null;
  student_id?: string | null;
  teacher_id?: string | null;
  new_teacher_id?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  new_date?: string | null;
  new_time?: string | null;
  status?: string | null;
  class_number?: number | string | null;
  teacher_zoom_url?: string | null;
}

/** Fila de GET students&role=teacher (solo lo que usa el inicio). */
export interface ILeapEstudiante {
  id?: string | number | null;
  name?: string | null;
}

/** Fila de POST class_sessions {action:'pending_attendance'}. */
export interface ILeapAsistenciaPendiente {
  id?: number | string | null;
  student_name?: string | null;
  fecha?: string | null;
  hora?: string | null;
}

/** Fila de GET tasks&teacher_id. */
export interface ILeapTareaProfe {
  id?: number | string | null;
  title?: string | null;
  status?: string | null;
  student_name?: string | null;
}

/** POST chispa {action:'get_unread', role:'teacher'}. */
export interface ILeapNoLeidosProfe {
  total?: number | string;
  unreadMap?: Record<string, number>;
}
