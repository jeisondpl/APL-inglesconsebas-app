import type {
  IClaseHoy,
  IResponseClaseProfe,
  IResponseEstudianteProfe,
  IResponseTareaRevision,
  MomentoClase,
} from '../entities/InicioProfe.entities';
import { hoyBogota, instanteBogota } from './inicio.validations';

/** Duración de una clase cuando Leap no la da (student_schedule.duration_minutes por defecto). */
export const DURACION_CLASE_MIN = 50;
const MINUTO = 60 * 1000;

/** Estados que siguen siendo una clase del día (los cancelados, festivos o vencidos no). */
const ESTADOS_DEL_DIA = new Set([
  'scheduled',
  'taken',
  'no_show',
  'rescheduled',
  'rescheduled_taken',
  'rescheduled_no_show',
]);
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
 * Clases de hoy (Bogotá) que da el profe, ordenadas por hora. Fecha, hora y profe son los
 * efectivos (la reprogramación manda), como en la web. El nombre sale de la lista de estudiantes;
 * si no está, se usa `sinNombre`.
 */
export function clasesDeHoy(
  clases: readonly IResponseClaseProfe[],
  estudiantes: readonly IResponseEstudianteProfe[],
  idProfe: string,
  ahoraMs: number,
  sinNombre: string,
): IClaseHoy[] {
  const hoy = hoyBogota(ahoraMs);
  const nombres = new Map(estudiantes.map(e => [e.id, e.nombre]));
  return clases
    .filter(
      c =>
        c.idProfe === idProfe &&
        c.fecha === hoy &&
        ESTADOS_DEL_DIA.has(c.estado),
    )
    .map(c => ({ c, inicioMs: instanteBogota(c.fecha, c.hora) }))
    .filter((x): x is { c: IResponseClaseProfe; inicioMs: number } =>
      Number.isFinite(x.inicioMs),
    )
    .sort((a, b) => a.inicioMs - b.inicioMs)
    .map(({ c, inicioMs }) => ({
      id: c.id,
      hora: c.hora,
      estudiante: nombres.get(c.idEstudiante) ?? sinNombre,
      momento: momentoClase(c.estado, inicioMs, ahoraMs),
      enlaceZoom: c.enlaceZoom,
      numeroClase: c.numeroClase,
      inicioMs,
    }));
}

/** La clase a destacar: la que está en curso o, si no, la próxima de hoy. */
export function claseDestacada(clases: readonly IClaseHoy[]): IClaseHoy | null {
  return (
    clases.find(c => c.momento === 'en_curso') ??
    clases.find(c => c.momento === 'proxima') ??
    null
  );
}

/** Tareas entregadas esperando revisión (`ready_review`), las más antiguas primero en la lista. */
export function tareasPorRevisar(tareas: readonly IResponseTareaRevision[]): {
  lista: IResponseTareaRevision[];
  total: number;
} {
  const porRevisar = tareas.filter(t => t.estado === 'ready_review');
  return { lista: porRevisar.slice(0, 3), total: porRevisar.length };
}
