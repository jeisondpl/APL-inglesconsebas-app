import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  EscenarioCancelacion,
  IOpcionCancelacion,
  IResponseClase,
  VistaPreviaCancelacion,
} from '../domain/entities/Clases.entities';
import type { ClasesRepository } from '../domain/models/ClasesRepository';
import type {
  ILeapCancelacion,
  ILeapClase,
  ILeapVistaPrevia,
} from './leapClases.tipos';

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

const ESCENARIOS: readonly string[] = [
  'flex_libera',
  'flex_tarde',
  'power_tarde',
  'power_elige',
  'elige',
  'reagendar_necesario',
  'sin_tokens',
  'reagendada',
] satisfies EscenarioCancelacion[];

/**
 * Vista previa del dominio a partir de la de Leap. Un escenario que la App no conoce (Leap lo
 * amplió) es un error de formato: mejor no dejar cancelar que cancelar sin explicar qué pasa.
 */
export function vistaPreviaDe(
  c: ILeapVistaPrevia,
): VistaPreviaCancelacion | null {
  if (c.puede === false) {
    return { puede: false, motivo: textoDe(c.motivo) ?? 'no_cancelable' };
  }
  const escenario = textoDe(c.escenario);
  const estadoFinal = textoDe(c.estadoFinal);
  const fecha = textoDe(c.fecha);
  if (
    c.puede !== true ||
    !escenario ||
    !ESCENARIOS.includes(escenario) ||
    !estadoFinal ||
    !fecha
  ) {
    return null;
  }
  const opciones = (c.opciones ?? [])
    .map((o): IOpcionCancelacion | null =>
      (o.opcion === 'reagendar' || o.opcion === 'soltar') && textoDe(o.estado)
        ? {
            opcion: o.opcion,
            estado: o.estado as string,
            descuentaToken: o.descuentaToken === true,
          }
        : null,
    )
    .filter((o): o is IOpcionCancelacion => o !== null);
  return {
    puede: true,
    escenario: escenario as EscenarioCancelacion,
    estadoFinal,
    opciones,
    descuentaToken: c.descuentaToken === true,
    fecha,
    hora: textoDe(c.hora) ?? '',
    horasRestantes: numeroDe(c.horasRestantes) ?? 0,
    tokensUsados: numeroDe(c.tokensUsados) ?? 0,
    tokensMaximos: numeroDe(c.tokensMaximos) ?? 0,
    afectaMinimo: c.afectaMinimo === true,
    minimo: numeroDe(c.minimo) ?? 0,
    enGrupo: c.enGrupo === true,
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

    async vistaPreviaCancelacion(idClase) {
      const r = await api.post<ILeapVistaPrevia>(
        'api.php',
        { action: 'cancel_preview', id: idClase },
        { endpoint: 'class_sessions' },
      );
      if (r.error) {
        return respuestaError(
          r.msg ?? textosComunes.errores.desconocido,
          r.code,
        );
      }
      const vista =
        r.response && typeof r.response === 'object'
          ? vistaPreviaDe(r.response)
          : null;
      return vista
        ? respuestaOk(vista, r.code)
        : respuestaError(textosComunes.errores.respuestaInvalida, r.code);
    },

    async cancelarClase({ idClase, opcion }) {
      const r = await api.post<ILeapCancelacion>(
        'api.php',
        {
          action: 'student_cancel',
          id: idClase,
          ...(opcion ? { opcion } : {}),
        },
        { endpoint: 'class_sessions' },
      );
      if (r.error) {
        return respuestaError(
          r.msg ?? textosComunes.errores.desconocido,
          r.code,
        );
      }
      const estadoFinal = textoDe(r.response?.finalStatus);
      return estadoFinal
        ? respuestaOk({ estadoFinal }, r.code)
        : respuestaError(textosComunes.errores.respuestaInvalida, r.code);
    },
  };
}
