import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsInicioProfe,
  IResumenInicioProfe,
} from '../../domain/entities/InicioProfe.entities';
import type { InicioProfeRepository } from '../../domain/models/InicioProfeRepository';
import { seccion } from '../obtenerResumenInicio/obtenerResumenInicio';

/**
 * Lee en paralelo todo lo que pinta el inicio del profe. Cada sección es independiente; solo es
 * error si fallan todas (sin red, servidor caído o sesión inválida).
 */
export async function obtenerResumenInicioProfeUseCase(
  repo: InicioProfeRepository,
  args: IArgsInicioProfe,
): Promise<HttpResponse<IResumenInicioProfe>> {
  const [clases, estudiantes, asistencias, tareas, noLeidos] =
    await Promise.all([
      repo.listarClases(),
      repo.listarEstudiantes(),
      repo.listarAsistenciasPendientes(args),
      repo.listarTareas(args),
      repo.contarNoLeidos(args),
    ] as const);
  const todas = [clases, estudiantes, asistencias, tareas, noLeidos];
  if (todas.every(r => r.error)) {
    return respuestaError(
      clases.msg ?? textosComunes.errores.desconocido,
      clases.code,
    );
  }
  return respuestaOk({
    clases: seccion(clases),
    estudiantes: seccion(estudiantes),
    asistencias: seccion(asistencias),
    tareas: seccion(tareas),
    noLeidos: seccion(noLeidos),
  });
}
