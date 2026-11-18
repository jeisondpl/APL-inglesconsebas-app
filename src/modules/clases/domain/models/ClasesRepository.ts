import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsCancelar,
  IArgsClases,
  IResponseCancelacion,
  IResponseClase,
  VistaPreviaCancelacion,
} from '../entities/Clases.entities';

/** Puerto de Clases del estudiante: lo que puede leer y hacer con su sesión. */
export interface ClasesRepository {
  /** Todas sus clases (el ciclo actual y los anteriores). */
  listarClases(args: IArgsClases): Promise<HttpResponse<IResponseClase[]>>;
  /** Qué pasaría si cancela esta clase (Leap decide; no escribe nada). */
  vistaPreviaCancelacion(
    idClase: string,
  ): Promise<HttpResponse<VistaPreviaCancelacion>>;
  /** Cancela la clase. Leap calcula el estado y el costo. */
  cancelarClase(
    args: IArgsCancelar,
  ): Promise<HttpResponse<IResponseCancelacion>>;
}
