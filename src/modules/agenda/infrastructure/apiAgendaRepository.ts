import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IResponseClaseAgenda,
  IResponseEstudianteAgenda,
} from '../domain/entities/Agenda.entities';
import type { AgendaRepository } from '../domain/models/AgendaRepository';
import type {
  ILeapClaseAgenda,
  ILeapEstudianteAgenda,
  ILeapMarca,
} from './leapAgenda.tipos';

const API = 'api.php';

const textoDe = (valor: unknown): string | null =>
  typeof valor === 'string' && valor.trim() ? valor.trim() : null;

const idDe = (valor: unknown): string | null =>
  valor === null || valor === undefined || valor === '' ? null : String(valor);

const numeroDe = (valor: unknown): number | null => {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Clase con fecha, hora y profe efectivos: la reprogramación (`new_*`) manda, como en la web. */
export function claseAgendaDe(
  c: ILeapClaseAgenda,
): IResponseClaseAgenda | null {
  const id = idDe(c.id);
  const fecha = textoDe(c.new_date) ?? textoDe(c.scheduled_date);
  const idProfe = textoDe(c.new_teacher_id) ?? textoDe(c.teacher_id);
  if (!id || !fecha || !idProfe) {
    return null;
  }
  return {
    id,
    idEstudiante: idDe(c.student_id) ?? '',
    fecha,
    hora: textoDe(c.new_time) ?? textoDe(c.scheduled_time) ?? '',
    idProfe,
    estado: textoDe(c.status) ?? '',
    numeroClase: numeroDe(c.class_number),
    enlaceZoom: textoDe(c.teacher_zoom_url),
  };
}

export function estudianteAgendaDe(
  c: ILeapEstudianteAgenda,
): IResponseEstudianteAgenda | null {
  const id = idDe(c.id);
  return id ? { id, nombre: textoDe(c.name) ?? '' } : null;
}

/** Lista de Leap mapeada; si la respuesta no es un array, error de formato. */
function lista<C, D>(
  r: HttpResponse<C[]>,
  mapear: (crudo: C) => D | null,
): HttpResponse<D[]> {
  if (r.error) {
    return respuestaError(r.msg ?? textosComunes.errores.desconocido, r.code);
  }
  if (!Array.isArray(r.response)) {
    return respuestaError(textosComunes.errores.respuestaInvalida, r.code);
  }
  const datos = r.response
    .filter((c): c is C => typeof c === 'object' && c !== null)
    .map(mapear)
    .filter((d): d is D => d !== null);
  return respuestaOk(datos, r.code);
}

/**
 * Adaptador de la agenda del profe con la API de Leap. Las lecturas las puede hacer cualquier
 * sesión de profe; marcar usa `update_status`, que para la App solo admite `taken` o `no_show` en
 * una clase propia que ya empezó (seguridad.php, `motivoMarcarClaseApp`).
 */
export function crearApiAgendaRepository(api: ClienteApi): AgendaRepository {
  return {
    async listarClases() {
      const r = await api.get<ILeapClaseAgenda[]>(API, {
        endpoint: 'class_sessions',
        all_teacher: '1',
      });
      return lista(r, claseAgendaDe);
    },

    async listarEstudiantes() {
      const r = await api.get<ILeapEstudianteAgenda[]>(API, {
        endpoint: 'students',
        role: 'teacher',
      });
      return lista(r, estudianteAgendaDe);
    },

    async marcarClase({ idClase, marca }) {
      const r = await api.post<ILeapMarca>(
        API,
        { action: 'update_status', id: idClase, status: marca },
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
