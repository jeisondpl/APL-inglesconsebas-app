/** Fila de GET class_sessions&all_teacher=1 (solo lo que usa la agenda del profe). */
export interface ILeapClaseAgenda {
  id?: number | string | null;
  student_id?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  new_date?: string | null;
  new_time?: string | null;
  teacher_id?: string | null;
  new_teacher_id?: string | null;
  status?: string | null;
  class_number?: number | string | null;
  teacher_zoom_url?: string | null;
}

/** Fila de GET students&role=teacher (solo id y nombre). */
export interface ILeapEstudianteAgenda {
  id?: number | string | null;
  name?: string | null;
}

/** Respuesta de POST class_sessions {action:'update_status'}. */
export interface ILeapMarca {
  ok?: boolean;
  finalStatus?: string;
}
