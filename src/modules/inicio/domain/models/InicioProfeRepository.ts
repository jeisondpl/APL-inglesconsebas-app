import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsInicioProfe,
  IResponseAsistenciaPendiente,
  IResponseClaseProfe,
  IResponseEstudianteProfe,
  IResponseTareaRevision,
} from '../entities/InicioProfe.entities';

/** Puerto del inicio del profe (F1-07): lecturas que el profe puede hacer con su sesión. */
export interface InicioProfeRepository {
  /** Sesiones de todos los profes desde hace 60 días (Leap no filtra: lo hace el dominio). */
  listarClases(): Promise<HttpResponse<IResponseClaseProfe[]>>;
  /** Estudiantes activos, para poner nombre a cada clase. */
  listarEstudiantes(): Promise<HttpResponse<IResponseEstudianteProfe[]>>;
  listarAsistenciasPendientes(
    args: IArgsInicioProfe,
  ): Promise<HttpResponse<IResponseAsistenciaPendiente[]>>;
  listarTareas(
    args: IArgsInicioProfe,
  ): Promise<HttpResponse<IResponseTareaRevision[]>>;
  /** Mensajes de sus estudiantes sin leer. */
  contarNoLeidos(args: IArgsInicioProfe): Promise<HttpResponse<number>>;
}
