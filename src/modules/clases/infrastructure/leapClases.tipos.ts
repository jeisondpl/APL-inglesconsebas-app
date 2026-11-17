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
