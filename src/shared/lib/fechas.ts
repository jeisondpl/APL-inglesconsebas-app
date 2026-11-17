/**
 * Fechas y horas de la academia. Leap guarda fechas `Y-m-d` y horas `HH:mm` en la hora de Bogotá
 * (UTC-5, sin horario de verano); aquí se interpretan sin depender de la zona del teléfono.
 */

/** Colombia está en UTC−5 todo el año (sin horario de verano). */
export const DESFASE_BOGOTA_MS = -5 * 60 * 60 * 1000;

const FECHA = /^(\d{4})-(\d{2})-(\d{2})/;
const HORA_TEXTO = /^(\d{1,2}):(\d{2})/;

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/** Partes de una fecha `Y-m-d`. `diaSemana` ISO: 1 = lunes … 7 = domingo. */
export interface IPartesFecha {
  anio: number;
  mes: number;
  dia: number;
  diaSemana: number;
}

/** Partes de una fecha `Y-m-d`, o `null` si no lo es. */
export function partesFecha(
  fecha: string | null | undefined,
): IPartesFecha | null {
  const m = FECHA.exec(fecha ?? '');
  if (!m) {
    return null;
  }
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const domingoCero = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return { anio, mes, dia, diaSemana: domingoCero === 0 ? 7 : domingoCero };
}

/** Horas y minutos de `HH:mm` (o `HH:mm:ss`), o `null`. */
export function partesHora(
  hora: string | null | undefined,
): { horas: number; minutos: number } | null {
  const m = HORA_TEXTO.exec(hora ?? '');
  if (!m) {
    return null;
  }
  const horas = Number(m[1]);
  const minutos = Number(m[2]);
  return horas < 24 && minutos < 60 ? { horas, minutos } : null;
}

/** Instante (ms UTC) de una fecha y hora de Bogotá, o `null` si no son válidas. */
export function instanteBogota(fecha: string, hora: string): number | null {
  const f = partesFecha(fecha);
  const h = partesHora(hora);
  if (!f || !h) {
    return null;
  }
  return (
    Date.UTC(f.anio, f.mes - 1, f.dia, h.horas, h.minutos) - DESFASE_BOGOTA_MS
  );
}

/** Fecha `Y-m-d` de hoy en Bogotá. */
export function hoyBogota(ahoraMs: number): string {
  return new Date(ahoraMs + DESFASE_BOGOTA_MS).toISOString().slice(0, 10);
}

/** «6:00 p. m.» a partir de `HH:mm`. Si no es una hora, la devuelve tal cual. */
export function hora12(hora: string): string {
  const h = partesHora(hora);
  if (!h) {
    return hora;
  }
  const sufijo = h.horas >= 12 ? 'p. m.' : 'a. m.';
  const doce = h.horas % 12 || 12;
  return `${doce}:${String(h.minutos).padStart(2, '0')} ${sufijo}`;
}

/** «15 nov». */
export function fechaCorta(fecha: string): string {
  const p = partesFecha(fecha);
  return p ? `${p.dia} ${MESES[p.mes - 1]}` : fecha;
}

/** «mar 29 sep». */
export function fechaConDia(fecha: string): string {
  const p = partesFecha(fecha);
  return p ? `${DIAS[p.diaSemana - 1]} ${p.dia} ${MESES[p.mes - 1]}` : fecha;
}

/** Nombre del día ISO (1 = lun … 7 = dom) y del mes (1 … 12), abreviados. */
export const nombreDia = (diaSemana: number): string => DIAS[diaSemana - 1];
export const nombreMes = (mes: number): string => MESES[mes - 1];
