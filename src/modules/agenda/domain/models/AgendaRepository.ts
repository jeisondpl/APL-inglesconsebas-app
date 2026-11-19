import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsMarcar,
  IResponseClaseAgenda,
  IResponseEstudianteAgenda,
} from '../entities/Agenda.entities';

/** Puerto de la agenda del profe: lo que puede leer y hacer con su sesión. */
export interface AgendaRepository {
  /** Las clases de todos los profes desde hace unos días (el dominio filtra las del profe). */
  listarClases(): Promise<HttpResponse<IResponseClaseAgenda[]>>;
  /** Estudiantes, para poner el nombre a cada clase. */
  listarEstudiantes(): Promise<HttpResponse<IResponseEstudianteAgenda[]>>;
  /** Marca la clase. Leap decide el estado final, el conteo del ciclo y el espejo al grupo. */
  marcarClase(
    args: IArgsMarcar,
  ): Promise<HttpResponse<{ estadoFinal: string }>>;
}
