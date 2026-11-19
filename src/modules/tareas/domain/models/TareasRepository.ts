import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsEntregar,
  IArgsRevisar,
  IResponseListaTareas,
  IResponseMediaTarea,
  SlotTarea,
} from '../entities/Tareas.entities';

/** Puerto remoto de las tareas (endpoint `tareas` de Leap, F3-02). La persona sale de la sesión. */
export interface TareasRepository {
  /** Sus tareas (estudiante) o las de sus estudiantes (profe). */
  listar(): Promise<HttpResponse<IResponseListaTareas>>;
  /** Voz e imágenes de una parte de la tarea, bajo demanda. */
  media(
    id: number,
    slot: SlotTarea,
  ): Promise<HttpResponse<IResponseMediaTarea>>;
  /** El estudiante entrega (o reentrega) su respuesta. */
  entregar(args: IArgsEntregar): Promise<HttpResponse<void>>;
  /** La profe revisa: comentario, nota y/o voz. */
  revisar(args: IArgsRevisar): Promise<HttpResponse<void>>;
  /** El estudiante vio el feedback. */
  marcarFeedbackVisto(id: number): Promise<HttpResponse<void>>;
}
