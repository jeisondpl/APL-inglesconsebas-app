import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type { IArgsClases, IResponseClase } from '../entities/Clases.entities';

/** Puerto de Clases del estudiante: lecturas que puede hacer con su sesión. */
export interface ClasesRepository {
  /** Todas sus clases (el ciclo actual y los anteriores). */
  listarClases(args: IArgsClases): Promise<HttpResponse<IResponseClase[]>>;
}
