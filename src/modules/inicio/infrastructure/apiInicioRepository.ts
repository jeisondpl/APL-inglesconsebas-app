import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IResponseFranjaHorario,
  IResponseMensaje,
  IResponsePlanEstudiante,
  IResponseSesionClase,
  IResponseTarea,
} from '../domain/entities/Inicio.entities';
import type { InicioRepository } from '../domain/models/InicioRepository';
import type {
  ILeapFranjaHorario,
  ILeapMeInicio,
  ILeapMensaje,
  ILeapNoLeidos,
  ILeapSesionClase,
  ILeapTarea,
} from './leapInicio.tipos';

const AUTH = 'auth.php';
const API = 'api.php';

/** Número de Leap (número o texto) o `fallback`. */
export function numeroDe(valor: unknown, fallback = 0): number {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/** Texto no vacío o `null`. */
export function textoDe(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

/** Errores del cliente HTTP tal cual, con su `msg` y `code`. */
function propagar<T>(r: HttpResponse<unknown>): HttpResponse<T> {
  return respuestaError<T>(r.msg ?? textosComunes.errores.desconocido, r.code);
}

function invalida<T>(code?: number): HttpResponse<T> {
  return respuestaError<T>(textosComunes.errores.respuestaInvalida, code);
}

/** Lista de Leap mapeada; si la respuesta no es un array, error de formato. */
function lista<C, D>(
  r: HttpResponse<C[]>,
  mapear: (crudo: C) => D | null,
): HttpResponse<D[]> {
  if (r.error) {
    return propagar(r);
  }
  if (!Array.isArray(r.response)) {
    return invalida(r.code);
  }
  const datos = r.response
    .filter((c): c is C => typeof c === 'object' && c !== null)
    .map(mapear)
    .filter((d): d is D => d !== null);
  return respuestaOk(datos, r.code);
}

export function planDe(crudo: ILeapMeInicio): IResponsePlanEstudiante | null {
  const s = crudo.student;
  if (!s || typeof s !== 'object') {
    return null;
  }
  const inicio = textoDe(s.cycle?.start);
  const fin = textoDe(s.cycle?.end);
  return {
    plan: textoDe(s.pkg),
    ciclo: inicio && fin ? { inicio, fin } : null,
    cancelacionesUsadas: numeroDe(s.tokensUsed),
    cancelacionesMaximas: numeroDe(s.tokensMax),
  };
}

export function sesionDe(c: ILeapSesionClase): IResponseSesionClase | null {
  const fecha = textoDe(c.scheduled_date);
  if (c.id === null || c.id === undefined || !fecha) {
    return null;
  }
  return {
    id: String(c.id),
    fecha,
    hora: textoDe(c.scheduled_time) ?? '',
    estado: textoDe(c.status) ?? '',
    cuentaComoTomada: numeroDe(c.counts_as_taken) === 1,
    inicioCiclo: textoDe(c.cycle_start),
    finCiclo: textoDe(c.cycle_end),
    fechaNueva: textoDe(c.new_date),
    horaNueva: textoDe(c.new_time),
    profe: textoDe(c.teacher_name),
    enlaceZoom: textoDe(c.teacher_zoom_url),
  };
}

export function franjaDe(c: ILeapFranjaHorario): IResponseFranjaHorario | null {
  const diaSemana = numeroDe(c.day_of_week, NaN);
  const hora = textoDe(c.class_time);
  if (!Number.isFinite(diaSemana) || !hora) {
    return null;
  }
  const duracion = numeroDe(c.duration_minutes, NaN);
  return {
    diaSemana,
    hora,
    duracionMin: Number.isFinite(duracion) && duracion > 0 ? duracion : null,
  };
}

export function tareaDe(c: ILeapTarea): IResponseTarea | null {
  if (c.id === null || c.id === undefined) {
    return null;
  }
  return {
    id: String(c.id),
    titulo: textoDe(c.title) ?? '',
    estado: textoDe(c.status) ?? '',
    venceEl: textoDe(c.due_date),
  };
}

export function mensajeDe(c: ILeapMensaje): IResponseMensaje | null {
  if (c.id === null || c.id === undefined) {
    return null;
  }
  const adjunto = textoDe(c.image_data)
    ? 'imagen'
    : textoDe(c.voice_data)
    ? 'voz'
    : null;
  return {
    id: String(c.id),
    remitente: textoDe(c.sender_name) ?? '',
    deEstudiante: c.sender === 'student',
    texto: textoDe(c.message) ?? '',
    adjunto,
    enviadoEl: textoDe(c.created_at) ?? '',
  };
}

/**
 * Adaptador del inicio con la API de Leap. Todas son lecturas que `PERMITIDAS_ESTUDIANTE`
 * (app/api/seguridad.php) deja hacer al estudiante con su propio id.
 */
export function crearApiInicioRepository(api: ClienteApi): InicioRepository {
  return {
    async obtenerPlan() {
      const r = await api.get<ILeapMeInicio>(AUTH, { action: 'me' });
      if (r.error) {
        return propagar(r);
      }
      const plan =
        r.response && typeof r.response === 'object'
          ? planDe(r.response)
          : null;
      return plan ? respuestaOk(plan, r.code) : invalida(r.code);
    },

    async listarClases({ idEstudiante }) {
      const r = await api.get<ILeapSesionClase[]>(API, {
        endpoint: 'class_sessions',
        student_id: idEstudiante,
      });
      return lista(r, sesionDe);
    },

    async listarHorario({ idEstudiante }) {
      const r = await api.get<ILeapFranjaHorario[]>(API, {
        endpoint: 'schedule',
        student_id: idEstudiante,
      });
      return lista(r, franjaDe);
    },

    async listarTareas({ idEstudiante }) {
      const r = await api.get<ILeapTarea[]>(API, {
        endpoint: 'tasks',
        student_id: idEstudiante,
      });
      return lista(r, tareaDe);
    },

    async contarNoLeidos({ idEstudiante }) {
      const r = await api.post<ILeapNoLeidos>(
        API,
        { action: 'get_unread', studentId: idEstudiante },
        { endpoint: 'chispa' },
      );
      if (r.error) {
        return propagar(r);
      }
      const n = numeroDe(r.response?.unread, NaN);
      return Number.isFinite(n)
        ? respuestaOk(Math.max(0, n), r.code)
        : invalida(r.code);
    },

    async listarMensajes({ idEstudiante }) {
      const r = await api.post<ILeapMensaje[]>(
        API,
        { action: 'get_thread', studentId: idEstudiante },
        { endpoint: 'chispa' },
      );
      return lista(r, mensajeDe);
    },
  };
}
