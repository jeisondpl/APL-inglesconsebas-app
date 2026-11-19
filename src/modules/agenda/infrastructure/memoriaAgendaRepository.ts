import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseClaseAgenda,
  IResponseEstudianteAgenda,
} from '../domain/entities/Agenda.entities';
import type { AgendaRepository } from '../domain/models/AgendaRepository';

export interface IOpcionesMemoriaAgenda {
  estudiantes?: IResponseEstudianteAgenda[];
  /** Fuerza el error de marcar (p. ej. la clase ya tenía marca). */
  marcarError?: { msg: string; code?: number };
}

/** Puerto en memoria para pruebas. Vacío por defecto: la agenda pinta su estado vacío. */
export function crearMemoriaAgendaRepository(
  clases: IResponseClaseAgenda[] = [],
  opciones: IOpcionesMemoriaAgenda = {},
): AgendaRepository {
  return {
    listarClases: async () => respuestaOk(clases),
    listarEstudiantes: async () => respuestaOk(opciones.estudiantes ?? []),
    marcarClase: async ({ marca }) =>
      opciones.marcarError
        ? respuestaError(opciones.marcarError.msg, opciones.marcarError.code)
        : respuestaOk({ estadoFinal: marca }),
  };
}
