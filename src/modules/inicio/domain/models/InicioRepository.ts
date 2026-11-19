import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsResumenInicio,
  IResponseFranjaHorario,
  IResponseMensaje,
  IResponsePlanEstudiante,
  IResponseSesionClase,
  IResponseTarea,
} from '../entities/Inicio.entities';

/** Puerto del inicio del estudiante: lecturas que el estudiante puede hacer con su sesión. */
export interface InicioRepository {
  /** Plan, ciclo y cancelaciones (auth.php?action=me). */
  obtenerPlan(): Promise<HttpResponse<IResponsePlanEstudiante>>;
  listarClases(
    args: IArgsResumenInicio,
  ): Promise<HttpResponse<IResponseSesionClase[]>>;
  listarHorario(
    args: IArgsResumenInicio,
  ): Promise<HttpResponse<IResponseFranjaHorario[]>>;
  listarTareas(
    args: IArgsResumenInicio,
  ): Promise<HttpResponse<IResponseTarea[]>>;
  contarNoLeidos(args: IArgsResumenInicio): Promise<HttpResponse<number>>;
  /** Hilo de mensajes con la academia, del más antiguo al más reciente. */
  listarMensajes(
    args: IArgsResumenInicio,
  ): Promise<HttpResponse<IResponseMensaje[]>>;
}
