import type {
  CuentaAtras,
  ICancelaciones,
  IProgresoCiclo,
  IProximaClase,
  IResponseFranjaHorario,
  IResponseMensaje,
  IResponsePlanEstudiante,
  IResponseSesionClase,
  IResponseTarea,
} from '../entities/Inicio.entities';
import {
  hoyBogota,
  instanteBogota,
  partesFecha,
  partesHora,
  type IPartesFecha,
} from '@/shared/lib/fechas';

import {
  ESTADOS_SIN_IMPACTO,
  HORAS_AVISO,
  HORAS_AVISO_FLEX,
  MAX_TAREAS_INICIO,
  MINUTOS_CLASE_EN_CURSO,
  PLAN_POWER,
  REGLAS_PLAN,
} from '../inicio.reglas';

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

// Las fechas de Bogotá viven en shared/lib/fechas; se re-exportan para el resto del módulo.
export { hoyBogota, instanteBogota, partesFecha, partesHora };
export type { IPartesFecha };

/** `HH:mm` normalizada (sin segundos, con dos dígitos). */
function horaCorta(hora: string): string {
  const h = partesHora(hora);
  return h
    ? `${String(h.horas).padStart(2, '0')}:${String(h.minutos).padStart(
        2,
        '0',
      )}`
    : hora;
}

/** Duración de la franja del horario que corresponde a ese día y hora, si la hay. */
export function duracionDeFranja(
  horario: readonly IResponseFranjaHorario[],
  fecha: string,
  hora: string,
): number | null {
  const dia = partesFecha(fecha)?.diaSemana;
  const franja = horario.find(
    f => f.diaSemana === dia && horaCorta(f.hora) === horaCorta(hora),
  );
  return franja?.duracionMin ?? null;
}

/**
 * Próxima clase del estudiante, como la decide la web: `scheduled` en su fecha y hora o
 * `rescheduled` en la nueva. Sigue siendo «la próxima» hasta 50 minutos después de empezar.
 */
export function proximaClase(
  sesiones: readonly IResponseSesionClase[],
  horario: readonly IResponseFranjaHorario[],
  ahoraMs: number,
): IProximaClase | null {
  let mejor: IProximaClase | null = null;
  for (const s of sesiones) {
    const reagendada = s.estado === 'rescheduled';
    if (s.estado !== 'scheduled' && !reagendada) {
      continue;
    }
    const fecha = reagendada ? s.fechaNueva ?? '' : s.fecha;
    const hora = reagendada ? s.horaNueva ?? s.hora : s.hora;
    const inicioMs = instanteBogota(fecha, hora);
    if (
      inicioMs === null ||
      inicioMs + MINUTOS_CLASE_EN_CURSO * MINUTO <= ahoraMs
    ) {
      continue;
    }
    if (!mejor || inicioMs < mejor.inicioMs) {
      mejor = {
        id: s.id,
        fecha,
        hora: horaCorta(hora),
        inicioMs,
        profe: s.profe,
        enlaceZoom: s.enlaceZoom,
        duracionMin: duracionDeFranja(horario, fecha, hora),
        reagendada,
      };
    }
  }
  return mejor;
}

/** Cuánto falta: «ahora» si ya empezó, minutos (< 1 h), horas (< 24 h) o días. */
export function cuentaAtras(inicioMs: number, ahoraMs: number): CuentaAtras {
  const falta = inicioMs - ahoraMs;
  if (falta <= 0) {
    return { tipo: 'ahora' };
  }
  if (falta < HORA) {
    return { tipo: 'minutos', valor: Math.max(1, Math.ceil(falta / MINUTO)) };
  }
  if (falta < DIA) {
    return { tipo: 'horas', valor: Math.floor(falta / HORA) };
  }
  return { tipo: 'dias', valor: Math.floor(falta / DIA) };
}

export type EtiquetaDia =
  | { tipo: 'hoy' }
  | { tipo: 'manana' }
  | ({ tipo: 'fecha' } & IPartesFecha);

/** «Hoy», «Mañana» o la fecha, respecto al día de hoy en Bogotá. */
export function etiquetaDia(
  fecha: string,
  ahoraMs: number,
): EtiquetaDia | null {
  const partes = partesFecha(fecha);
  if (!partes) {
    return null;
  }
  const hoy = hoyBogota(ahoraMs);
  if (fecha.slice(0, 10) === hoy) {
    return { tipo: 'hoy' };
  }
  if (fecha.slice(0, 10) === hoyBogota(ahoraMs + DIA)) {
    return { tipo: 'manana' };
  }
  return { tipo: 'fecha', ...partes };
}

/** Nombre visible del plan, sin emoji. Un plan desconocido se muestra tal cual. */
export function nombrePlan(plan: string | null): string | null {
  if (!plan) {
    return null;
  }
  return REGLAS_PLAN[plan]?.nombre ?? plan;
}

/**
 * Progreso del ciclo con la regla de la web (StudentHome): sesiones del ciclo de hoy; tomadas las
 * que cuentan como tomadas sin los estados *no_impact*; total el mínimo del plan, o en Power⚡ las
 * sesiones del ciclo sin los *no_impact*.
 */
export function progresoCiclo(
  sesiones: readonly IResponseSesionClase[],
  plan: string | null,
  ahoraMs: number,
): IProgresoCiclo {
  const hoy = hoyBogota(ahoraMs);
  const delCiclo = sesiones.filter(
    s =>
      s.inicioCiclo !== null &&
      s.finCiclo !== null &&
      s.inicioCiclo <= hoy &&
      s.finCiclo >= hoy &&
      !ESTADOS_SIN_IMPACTO.includes(s.estado),
  );
  const tomadas = delCiclo.filter(s => s.cuentaComoTomada).length;
  const total =
    plan === PLAN_POWER
      ? delCiclo.length
      : plan
      ? REGLAS_PLAN[plan]?.minimo ?? null
      : null;
  const fraccion = total ? Math.min(1, tomadas / total) : 0;
  return { tomadas, total, fraccion };
}

/** Horas de antelación para cancelar sin que cuente como tomada. */
export function horasDeAviso(plan: string | null): number {
  const flex = plan
    ? REGLAS_PLAN[plan]?.flex ?? plan.startsWith('Flex')
    : false;
  return flex ? HORAS_AVISO_FLEX : HORAS_AVISO;
}

/** Cancelaciones (tokens) que le quedan en el ciclo. */
export function cancelacionesDisponibles(
  datos: IResponsePlanEstudiante,
): ICancelaciones {
  const maximas = Math.max(0, datos.cancelacionesMaximas);
  return {
    maximas,
    disponibles: Math.max(
      0,
      Math.min(maximas, maximas - datos.cancelacionesUsadas),
    ),
    horasAviso: horasDeAviso(datos.plan),
  };
}

/** Tareas por entregar (`pending`), las que vencen antes primero; hasta 3 y el total. */
export function tareasPendientes(tareas: readonly IResponseTarea[]): {
  lista: IResponseTarea[];
  total: number;
} {
  const pendientes = tareas
    .filter(t => t.estado === 'pending')
    .sort((a, b) => {
      if (a.venceEl === b.venceEl) {
        return 0;
      }
      if (!a.venceEl) {
        return 1;
      }
      if (!b.venceEl) {
        return -1;
      }
      return a.venceEl < b.venceEl ? -1 : 1;
    });
  return {
    lista: pendientes.slice(0, MAX_TAREAS_INICIO),
    total: pendientes.length,
  };
}

/** Si la fecha de entrega ya pasó, es hoy o está por venir. */
export function estadoVencimiento(
  venceEl: string | null,
  ahoraMs: number,
): 'vencida' | 'hoy' | 'futura' | null {
  if (!partesFecha(venceEl)) {
    return null;
  }
  const fecha = (venceEl as string).slice(0, 10);
  const hoy = hoyBogota(ahoraMs);
  if (fecha === hoy) {
    return 'hoy';
  }
  return fecha < hoy ? 'vencida' : 'futura';
}

/** El mensaje más reciente del hilo, o `null`. */
export function ultimoMensaje(
  mensajes: readonly IResponseMensaje[],
): IResponseMensaje | null {
  let ultimo: IResponseMensaje | null = null;
  for (const m of mensajes) {
    if (!ultimo || m.enviadoEl >= ultimo.enviadoEl) {
      ultimo = m;
    }
  }
  return ultimo;
}

/** Inicial del nombre para el avatar (mayúscula), o «?» si no hay nombre. */
/** Primer nombre para el saludo («Ana Torres» → «Ana»); vacío si no hay nombre. */
export function nombreDePila(nombre: string | null | undefined): string {
  return (nombre ?? '').trim().split(/\s+/)[0] ?? '';
}

export function inicialDe(nombre: string | null | undefined): string {
  const limpio = (nombre ?? '').trim();
  return limpio ? limpio.charAt(0).toLocaleUpperCase('es') : '?';
}
