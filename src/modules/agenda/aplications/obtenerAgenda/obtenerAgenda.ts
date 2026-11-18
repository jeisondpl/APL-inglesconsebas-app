import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsAgenda,
  IArgsMarcar,
  IResponseClaseAgenda,
  IResponseEstudianteAgenda,
} from '../../domain/entities/Agenda.entities';
import { mensajesAgenda } from '../../domain/agenda.mensajes';
import type { AgendaRepository } from '../../domain/models/AgendaRepository';

export interface IDatosAgenda {
  clases: IResponseClaseAgenda[];
  /** Vacío si la lista de estudiantes no cargó: las clases salen con el nombre genérico. */
  estudiantes: IResponseEstudianteAgenda[];
}

/**
 * Lee las clases y los nombres. Sin clases no hay agenda (error); sin nombres sí: es mejor ver el
 * horario con un nombre genérico que no verlo.
 */
export async function obtenerAgendaUseCase(
  repo: AgendaRepository,
  args: IArgsAgenda,
): Promise<HttpResponse<IDatosAgenda>> {
  if (!args.idProfe) {
    return respuestaError(textosComunes.errores.desconocido);
  }
  const [clases, estudiantes] = await Promise.all([
    repo.listarClases(),
    repo.listarEstudiantes(),
  ]);
  if (clases.error || !clases.response) {
    return respuestaError(
      clases.msg ?? textosComunes.errores.desconocido,
      clases.code,
    );
  }
  return respuestaOk({
    clases: clases.response,
    estudiantes: estudiantes.response ?? [],
  });
}

/** Marca la clase. Un error sin mensaje se convierte en el genérico; Leap decide si se puede. */
export async function marcarClaseUseCase(
  repo: AgendaRepository,
  args: IArgsMarcar,
): Promise<HttpResponse<{ estadoFinal: string }>> {
  if (args.marca !== 'taken' && args.marca !== 'no_show') {
    return respuestaError(mensajesAgenda.marcaInvalida);
  }
  const r = await repo.marcarClase(args);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
