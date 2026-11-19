import { hoyBogota, instanteBogota } from '@/shared/lib/fechas';

import type {
  ICicloClases,
  IClaseHistorial,
  IEspacioReagendar,
  IEstadoVisible,
  IResponseClase,
  IResumenCiclo,
} from '../entities/Clases.entities';

const MINUTO = 60 * 1000;
/** Una clase sigue siendo «la próxima» hasta 50 minutos después de empezar (como en el inicio). */
const MINUTOS_CLASE_EN_CURSO = 50;

/**
 * Cómo se ve cada estado de `class_sessions.status`. Es el vocabulario de la web
 * (`SESSION_STATUS_DISPLAY`) en español. Un estado que la App no conoce se muestra tal cual, en
 * neutro: mejor eso que esconder una clase.
 */
const ESTADOS: Record<string, IEstadoVisible> = {
  scheduled: { etiqueta: 'Programada', tono: 'neutra' },
  taken: { etiqueta: 'Tomada', tono: 'exito' },
  no_show: { etiqueta: 'No asististe', tono: 'aviso' },
  cancelled_late: { etiqueta: 'Cancelada tarde', tono: 'aviso' },
  cancelled_late_no_impact: { etiqueta: 'Cancelada', tono: 'neutra' },
  cancelled_no_impact: { etiqueta: 'Cancelada', tono: 'neutra' },
  cancelled_impacts_min: { etiqueta: 'Cancelada', tono: 'aviso' },
  cancelled_no_tokens: { etiqueta: 'Cancelada sin cupo', tono: 'peligro' },
  holiday_no_impact: { etiqueta: 'Festivo', tono: 'neutra' },
  holiday_impacts_min: { etiqueta: 'Festivo · por reagendar', tono: 'aviso' },
  to_reschedule: { etiqueta: 'Por reagendar', tono: 'aviso' },
  vacation_hold: { etiqueta: 'Por reponer', tono: 'aviso' },
  rescheduled: { etiqueta: 'Reagendada', tono: 'exito' },
  rescheduled_taken: { etiqueta: 'Reagendada · tomada', tono: 'exito' },
  rescheduled_no_show: { etiqueta: 'Reagendada · no asististe', tono: 'aviso' },
  rescheduled_cancelled: {
    etiqueta: 'Reagendada · cancelada',
    tono: 'peligro',
  },
  medical_exception: { etiqueta: 'Excepción médica', tono: 'neutra' },
  expired: { etiqueta: 'Vencida', tono: 'aviso' },
};

/** Estados que no ocupan lugar en el ciclo (la clase pierde su número). */
const SIN_IMPACTO = [
  'holiday_no_impact',
  'cancelled_no_impact',
  'cancelled_late_no_impact',
];
const POR_REAGENDAR = ['to_reschedule', 'holiday_impacts_min', 'vacation_hold'];
const CANCELADAS = [
  'cancelled_late',
  'cancelled_late_no_impact',
  'cancelled_no_impact',
  'cancelled_impacts_min',
  'cancelled_no_tokens',
  'rescheduled_cancelled',
];
const PROGRAMADAS = ['scheduled', 'rescheduled'];

/** Etiqueta y tono de un estado. */
export function estadoVisible(estado: string): IEstadoVisible {
  return (
    ESTADOS[estado] ?? { etiqueta: estado || 'Sin estado', tono: 'neutra' }
  );
}

/**
 * Clase con su fecha efectiva: si se reagendó, la fecha y hora nuevas mandan y la original se
 * conserva aparte para mostrarla.
 */
export function claseHistorial(c: IResponseClase): IClaseHistorial {
  const reagendada =
    c.estado.startsWith('rescheduled') && c.fechaNueva !== null;
  const fecha = reagendada ? (c.fechaNueva as string) : c.fecha;
  const hora = reagendada ? c.horaNueva ?? c.hora : c.hora;
  return {
    id: c.id,
    fecha,
    hora,
    fechaOriginal: reagendada ? c.fecha : null,
    estado: c.estado,
    numeroClase: c.numeroClase,
    profe: c.profe,
    enlaceZoom: c.enlaceZoom,
    inicioMs: instanteBogota(fecha, hora),
  };
}

/** Totales de un ciclo: tomadas (cuentan y ocupan lugar), programadas, por reagendar y canceladas. */
export function resumenCiclo(
  clases: readonly IResponseClase[],
  ahoraMs: number,
): IResumenCiclo {
  const hoy = hoyBogota(ahoraMs);
  return {
    tomadas: clases.filter(
      c => c.cuentaComoTomada && !SIN_IMPACTO.includes(c.estado),
    ).length,
    programadas: clases.filter(
      c => PROGRAMADAS.includes(c.estado) && claseHistorial(c).fecha >= hoy,
    ).length,
    porReagendar: clases.filter(c => POR_REAGENDAR.includes(c.estado)).length,
    canceladas: clases.filter(c => CANCELADAS.includes(c.estado)).length,
  };
}

/** La primera programada que aún no pasó (hasta 50 min después de empezar). */
function proxima(
  clases: readonly IClaseHistorial[],
  ahoraMs: number,
): string | null {
  const limite = ahoraMs - MINUTOS_CLASE_EN_CURSO * MINUTO;
  const candidata = clases.find(
    c =>
      PROGRAMADAS.includes(c.estado) &&
      c.inicioMs !== null &&
      c.inicioMs > limite,
  );
  return candidata?.id ?? null;
}

/**
 * Agrupa las clases por ciclo (de inicio a fin, como los guarda Leap). Devuelve los ciclos del más
 * reciente al más antiguo; cada uno con sus clases por fecha. El actual es el que contiene hoy.
 * Las clases sin ciclo no se pierden: van juntas en un ciclo sin fechas.
 */
export function ciclosDeClases(
  clases: readonly IResponseClase[],
  ahoraMs: number,
): ICicloClases[] {
  const hoy = hoyBogota(ahoraMs);
  const grupos = new Map<string, IResponseClase[]>();
  for (const c of clases) {
    const clave = `${c.inicioCiclo ?? ''}|${c.finCiclo ?? ''}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), c]);
  }
  return [...grupos.entries()]
    .map(([id, filas]): ICicloClases => {
      const inicio = filas[0].inicioCiclo;
      const fin = filas[0].finCiclo;
      const ordenadas = filas
        .map(claseHistorial)
        .sort(
          (a, b) =>
            a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora),
        );
      return {
        id,
        inicio,
        fin,
        esActual:
          inicio !== null && fin !== null && inicio <= hoy && fin >= hoy,
        clases: ordenadas,
        resumen: resumenCiclo(filas, ahoraMs),
        proximaId: proxima(ordenadas, ahoraMs),
      };
    })
    .sort((a, b) => (b.inicio ?? '').localeCompare(a.inicio ?? ''));
}

/**
 * ¿Se ofrece el botón «Cancelar»? Solo una clase programada, o reagendada con su fecha nueva, que
 * aún no empezó. Es solo para no mostrar un botón inútil: quien decide si se puede y qué pasa es
 * Leap (la vista previa y la cancelación lo vuelven a comprobar).
 */
export function puedeIntentarCancelar(
  clase: IClaseHistorial,
  ahoraMs: number,
): boolean {
  return (
    PROGRAMADAS.includes(clase.estado) &&
    clase.inicioMs !== null &&
    clase.inicioMs > ahoraMs
  );
}

/** La clase espera que escoja un espacio nuevo. Leap decide si de verdad se puede (plazo, grupo). */
export function puedeIntentarReagendar(clase: IClaseHistorial): boolean {
  return clase.estado === 'to_reschedule';
}

export interface IDiaEspacios {
  fecha: string;
  espacios: IEspacioReagendar[];
}

/** Los espacios por día, en orden de fecha; en cada día, primero su profe y luego por hora. */
export function espaciosPorDia(
  espacios: readonly IEspacioReagendar[],
): IDiaEspacios[] {
  const dias = new Map<string, IEspacioReagendar[]>();
  for (const e of espacios) {
    dias.set(e.fecha, [...(dias.get(e.fecha) ?? []), e]);
  }
  return [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, lista]) => ({
      fecha,
      espacios: [...lista].sort(
        (a, b) =>
          Number(b.esMiProfe) - Number(a.esMiProfe) ||
          a.hora.localeCompare(b.hora) ||
          a.profe.localeCompare(b.profe),
      ),
    }));
}

/** Posición del ciclo que se abre primero: el actual; si no hay, el más reciente. */
export function indiceCicloInicial(ciclos: readonly ICicloClases[]): number {
  const actual = ciclos.findIndex(c => c.esActual);
  return actual >= 0 ? actual : 0;
}
