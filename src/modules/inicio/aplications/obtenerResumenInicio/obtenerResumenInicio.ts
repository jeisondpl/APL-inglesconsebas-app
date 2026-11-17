import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsResumenInicio,
  IResumenInicio,
  Seccion,
} from '../../domain/entities/Inicio.entities';
import type { InicioRepository } from '../../domain/models/InicioRepository';

/** Respuesta de una lectura como sección del inicio (la comparten estudiante y profe). */
export function seccion<T>(r: HttpResponse<T>): Seccion<T> {
  return !r.error && r.response !== undefined
    ? { ok: true, datos: r.response }
    : { ok: false, msg: r.msg ?? textosComunes.errores.desconocido };
}

/**
 * Lee en paralelo todo lo que pinta el inicio. Cada sección es independiente: si una falla, las
 * demás se pintan. Solo es error si fallan todas (sin red, servidor caído o sesión inválida).
 */
export async function obtenerResumenInicioUseCase(
  repo: InicioRepository,
  args: IArgsResumenInicio,
): Promise<HttpResponse<IResumenInicio>> {
  const [plan, clases, horario, tareas, noLeidos, mensajes] = await Promise.all(
    [
      repo.obtenerPlan(),
      repo.listarClases(args),
      repo.listarHorario(args),
      repo.listarTareas(args),
      repo.contarNoLeidos(args),
      repo.listarMensajes(args),
    ] as const,
  );
  const todas = [plan, clases, horario, tareas, noLeidos, mensajes];
  if (todas.every(r => r.error)) {
    const primera = todas[0];
    return respuestaError(
      primera.msg ?? textosComunes.errores.desconocido,
      primera.code,
    );
  }
  return respuestaOk({
    plan: seccion(plan),
    clases: seccion(clases),
    horario: seccion(horario),
    tareas: seccion(tareas),
    noLeidos: seccion(noLeidos),
    mensajes: seccion(mensajes),
  });
}
