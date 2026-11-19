import { hoyBogota, instanteBogota, partesFecha } from '@/shared/lib/fechas';

import type {
  IClaseAgenda,
  IDiaSemana,
  IResponseClaseAgenda,
  IResponseEstudianteAgenda,
  MomentoClase,
} from '../entities/Agenda.entities';

/** Duración de una clase cuando Leap no la da (student_schedule.duration_minutes por defecto). */
export const DURACION_CLASE_MIN = 50;
const MINUTO = 60 * 1000;
const DIA_MS = 24 * 60 * MINUTO;
/** Cuánto hacia atrás se buscan clases sin marcar (como `pending_attendance` de la web). */
export const DIAS_SIN_MARCAR = 30;

/** Estados que siguen siendo una clase de la agenda (los cancelados, festivos o vencidos no). */
const ESTADOS_DE_AGENDA = new Set([
  'scheduled',
  'taken',
  'no_show',
  'rescheduled',
  'rescheduled_taken',
  'rescheduled_no_show',
]);
const PROGRAMADAS = new Set(['scheduled', 'rescheduled']);
const TOMADA = new Set(['taken', 'rescheduled_taken']);
const NO_ASISTIO = new Set(['no_show', 'rescheduled_no_show']);

/** Momento de una clase: ya marcada, o según la hora si sigue programada. */
export function momentoClase(
  estado: string,
  inicioMs: number,
  ahoraMs: number,
): MomentoClase {
  if (TOMADA.has(estado)) {
    return 'tomada';
  }
  if (NO_ASISTIO.has(estado)) {
    return 'no_asistio';
  }
  if (ahoraMs < inicioMs) {
    return 'proxima';
  }
  return ahoraMs < inicioMs + DURACION_CLASE_MIN * MINUTO
    ? 'en_curso'
    : 'por_marcar';
}

/**
 * Las clases que da el profe, por fecha y hora. Fecha, hora y profe son los efectivos (la
 * reprogramación manda), como en la web. El nombre sale de la lista de estudiantes; si no está, se
 * usa `sinNombre`.
 */
export function clasesDelProfe(
  clases: readonly IResponseClaseAgenda[],
  estudiantes: readonly IResponseEstudianteAgenda[],
  idProfe: string,
  ahoraMs: number,
  sinNombre: string,
): IClaseAgenda[] {
  const nombres = new Map(estudiantes.map(e => [e.id, e.nombre]));
  return clases
    .filter(c => c.idProfe === idProfe && ESTADOS_DE_AGENDA.has(c.estado))
    .map(c => ({ c, inicioMs: instanteBogota(c.fecha, c.hora) }))
    .filter((x): x is { c: IResponseClaseAgenda; inicioMs: number } =>
      Number.isFinite(x.inicioMs),
    )
    .sort((a, b) => a.inicioMs - b.inicioMs)
    .map(({ c, inicioMs }) => ({
      id: c.id,
      fecha: c.fecha,
      hora: c.hora,
      estudiante: nombres.get(c.idEstudiante) ?? sinNombre,
      estado: c.estado,
      momento: momentoClase(c.estado, inicioMs, ahoraMs),
      numeroClase: c.numeroClase,
      enlaceZoom: c.enlaceZoom,
      inicioMs,
    }));
}

/** Las clases de un día (ya vienen ordenadas por hora). */
export function clasesDelDia(
  clases: readonly IClaseAgenda[],
  fecha: string,
): IClaseAgenda[] {
  return clases.filter(c => c.fecha === fecha);
}

/** Suma (o resta) días a una fecha `Y-m-d`. */
export function sumarDias(fecha: string, dias: number): string {
  const p = partesFecha(fecha);
  if (!p) {
    return fecha;
  }
  const d = new Date(Date.UTC(p.anio, p.mes - 1, p.dia) + dias * DIA_MS);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(
    d.getUTCDate(),
  )}`;
}

/** Las siete fechas de la semana (lunes a domingo) que contiene `fecha`. */
export function semanaDe(fecha: string): string[] {
  const p = partesFecha(fecha);
  if (!p) {
    return [];
  }
  const lunes = sumarDias(fecha, 1 - p.diaSemana);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** Una fila por día de la semana, con cuántas clases tiene y cuántas faltan por marcar. */
export function resumenSemana(
  clases: readonly IClaseAgenda[],
  fecha: string,
  ahoraMs: number,
): IDiaSemana[] {
  const hoy = hoyBogota(ahoraMs);
  return semanaDe(fecha).map(f => {
    const delDia = clasesDelDia(clases, f);
    return {
      fecha: f,
      esHoy: f === hoy,
      total: delDia.length,
      sinMarcar: delDia.filter(c => c.momento === 'por_marcar').length,
    };
  });
}

/**
 * Clases de días anteriores que siguen sin marca (hasta 30 días atrás), las más recientes
 * primero. Las de hoy salen en la vista del día.
 */
export function sinMarcarAnteriores(
  clases: readonly IClaseAgenda[],
  ahoraMs: number,
): IClaseAgenda[] {
  const hoy = hoyBogota(ahoraMs);
  const desde = sumarDias(hoy, -DIAS_SIN_MARCAR);
  return clases
    .filter(
      c => c.momento === 'por_marcar' && c.fecha < hoy && c.fecha >= desde,
    )
    .sort((a, b) => b.inicioMs - a.inicioMs);
}

/**
 * Si se muestran los botones de marcar: la clase sigue programada y ya empezó. Solo evita un botón
 * inútil; quien decide si se puede (y si es suya) es Leap.
 */
export function puedeMarcar(clase: IClaseAgenda, ahoraMs: number): boolean {
  return PROGRAMADAS.has(clase.estado) && ahoraMs >= clase.inicioMs;
}
