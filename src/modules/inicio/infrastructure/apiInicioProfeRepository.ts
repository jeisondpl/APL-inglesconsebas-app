import type { ClienteApi } from '@/shared/lib/api';
import { respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseAsistenciaPendiente,
  IResponseClaseProfe,
  IResponseEstudianteProfe,
  IResponseTareaRevision,
} from '../domain/entities/InicioProfe.entities';
import type { InicioProfeRepository } from '../domain/models/InicioProfeRepository';
import {
  invalida,
  lista,
  numeroDe,
  propagar,
  textoDe,
} from './apiInicioRepository';
import type {
  ILeapAsistenciaPendiente,
  ILeapClaseProfe,
  ILeapEstudiante,
  ILeapNoLeidosProfe,
  ILeapTareaProfe,
} from './leapInicio.tipos';

const API = 'api.php';

const idDe = (valor: unknown): string | null =>
  valor === null || valor === undefined || valor === '' ? null : String(valor);

/** Clase con fecha, hora y profe efectivos: la reprogramación (`new_*`) manda, como en la web. */
export function claseProfeDe(c: ILeapClaseProfe): IResponseClaseProfe | null {
  const id = idDe(c.id);
  const fecha = textoDe(c.new_date) ?? textoDe(c.scheduled_date);
  const idProfe = textoDe(c.new_teacher_id) ?? textoDe(c.teacher_id);
  if (!id || !fecha || !idProfe) {
    return null;
  }
  const numero = numeroDe(c.class_number, NaN);
  return {
    id,
    idEstudiante: idDe(c.student_id) ?? '',
    fecha,
    hora: textoDe(c.new_time) ?? textoDe(c.scheduled_time) ?? '',
    idProfe,
    estado: textoDe(c.status) ?? '',
    numeroClase: Number.isFinite(numero) ? numero : null,
    enlaceZoom: textoDe(c.teacher_zoom_url),
  };
}

export function estudianteDe(
  c: ILeapEstudiante,
): IResponseEstudianteProfe | null {
  const id = idDe(c.id);
  return id ? { id, nombre: textoDe(c.name) ?? '' } : null;
}

export function asistenciaDe(
  c: ILeapAsistenciaPendiente,
): IResponseAsistenciaPendiente | null {
  const id = idDe(c.id);
  const fecha = textoDe(c.fecha);
  return id && fecha
    ? {
        id,
        estudiante: textoDe(c.student_name) ?? '',
        fecha,
        hora: textoDe(c.hora) ?? '',
      }
    : null;
}

export function tareaRevisionDe(
  c: ILeapTareaProfe,
): IResponseTareaRevision | null {
  const id = idDe(c.id);
  return id
    ? {
        id,
        titulo: textoDe(c.title) ?? '',
        estudiante: textoDe(c.student_name) ?? '',
        estado: textoDe(c.status) ?? '',
      }
    : null;
}

/**
 * Adaptador del inicio del profe con la API de Leap. Todas son lecturas que una sesión de profe
 * puede hacer (seguridad.php: fuera de SOLO_ADMIN). `pending_attendance` exige que `teacherId`
 * sea el del profe de la sesión. `class_sessions&all_teacher=1` y `students` traen todo: filtra
 * el dominio.
 */
export function crearApiInicioProfeRepository(
  api: ClienteApi,
): InicioProfeRepository {
  return {
    async listarClases() {
      const r = await api.get<ILeapClaseProfe[]>(API, {
        endpoint: 'class_sessions',
        all_teacher: '1',
      });
      return lista(r, claseProfeDe);
    },

    async listarEstudiantes() {
      const r = await api.get<ILeapEstudiante[]>(API, {
        endpoint: 'students',
        role: 'teacher',
      });
      return lista(r, estudianteDe);
    },

    async listarAsistenciasPendientes({ idProfe }) {
      const r = await api.post<ILeapAsistenciaPendiente[]>(
        API,
        { action: 'pending_attendance', teacherId: idProfe },
        { endpoint: 'class_sessions' },
      );
      return lista(r, asistenciaDe);
    },

    async listarTareas({ idProfe }) {
      const r = await api.get<ILeapTareaProfe[]>(API, {
        endpoint: 'tasks',
        teacher_id: idProfe,
      });
      return lista(r, tareaRevisionDe);
    },

    async contarNoLeidos({ idProfe }) {
      const r = await api.post<ILeapNoLeidosProfe>(
        API,
        { action: 'get_unread', role: 'teacher', teacherId: idProfe },
        { endpoint: 'chispa' },
      );
      if (r.error) {
        return propagar(r);
      }
      const n = numeroDe(r.response?.total, NaN);
      return Number.isFinite(n)
        ? respuestaOk(Math.max(0, n), r.code)
        : invalida(r.code);
    },
  };
}
