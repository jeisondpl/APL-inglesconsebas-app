import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsClases,
  IResponseClase,
} from '../../domain/entities/Clases.entities';
import type { ClasesRepository } from '../../domain/models/ClasesRepository';

/** Lee las clases del estudiante. Un error sin mensaje se convierte en el genérico. */
export async function obtenerClasesUseCase(
  repo: ClasesRepository,
  args: IArgsClases,
): Promise<HttpResponse<IResponseClase[]>> {
  const r = await repo.listarClases(args);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
