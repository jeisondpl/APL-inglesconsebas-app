import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type { IResponseClase } from '../domain/entities/Clases.entities';
import type { ClasesRepository } from '../domain/models/ClasesRepository';
import type { ILeapClase } from './leapClases.tipos';

const textoDe = (valor: unknown): string | null =>
  typeof valor === 'string' && valor.trim() ? valor.trim() : null;

const numeroDe = (valor: unknown): number | null => {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Clase del dominio a partir de una fila de Leap; `null` si no tiene id o fecha. */
export function claseDe(c: ILeapClase): IResponseClase | null {
  const fecha = textoDe(c.scheduled_date);
  if (c.id === null || c.id === undefined || !fecha) {
    return null;
  }
  return {
    id: String(c.id),
    fecha,
    hora: textoDe(c.scheduled_time) ?? '',
    estado: textoDe(c.status) ?? '',
    cuentaComoTomada:
      numeroDe(c.counts_as_taken) === 1 || c.counts_as_taken === true,
    numeroClase: numeroDe(c.class_number),
    inicioCiclo: textoDe(c.cycle_start),
    finCiclo: textoDe(c.cycle_end),
    fechaNueva: textoDe(c.new_date),
    horaNueva: textoDe(c.new_time),
    profe: textoDe(c.teacher_name),
    enlaceZoom: textoDe(c.teacher_zoom_url),
  };
}

/**
 * Adaptador de Clases con la API de Leap. Es una lectura que `PERMITIDAS_ESTUDIANTE`
 * (app/api/seguridad.php) deja hacer al estudiante con su propio id.
 */
export function crearApiClasesRepository(api: ClienteApi): ClasesRepository {
  return {
    async listarClases({
      idEstudiante,
    }): Promise<HttpResponse<IResponseClase[]>> {
      const r = await api.get<ILeapClase[]>('api.php', {
        endpoint: 'class_sessions',
        student_id: idEstudiante,
      });
      if (r.error) {
        return respuestaError(
          r.msg ?? textosComunes.errores.desconocido,
          r.code,
        );
      }
      if (!Array.isArray(r.response)) {
        return respuestaError(textosComunes.errores.respuestaInvalida, r.code);
      }
      const clases = r.response
        .filter((c): c is ILeapClase => typeof c === 'object' && c !== null)
        .map(claseDe)
        .filter((c): c is IResponseClase => c !== null);
      return respuestaOk(clases, r.code);
    },
  };
}
