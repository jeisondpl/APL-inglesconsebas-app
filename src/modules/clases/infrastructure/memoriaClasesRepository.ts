import { respuestaOk } from '@/shared/lib/HttpResponse';

import type { IResponseClase } from '../domain/entities/Clases.entities';
import type { ClasesRepository } from '../domain/models/ClasesRepository';

/** Puerto en memoria para pruebas. Vacío por defecto: Clases pinta su estado vacío. */
export function crearMemoriaClasesRepository(
  clases: IResponseClase[] = [],
): ClasesRepository {
  return { listarClases: async () => respuestaOk(clases) };
}
