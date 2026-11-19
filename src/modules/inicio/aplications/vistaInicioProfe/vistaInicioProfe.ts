import type { Seccion } from '../../domain/entities/Inicio.entities';
import type {
  IClaseHoy,
  IResponseAsistenciaPendiente,
  IResponseTareaRevision,
  IResumenInicioProfe,
} from '../../domain/entities/InicioProfe.entities';
import {
  claseDestacada,
  clasesDeHoy,
  tareasPorRevisar,
} from '../../domain/validations/inicioProfe.validations';

/** Lo que pinta el inicio del profe, ya calculado. Cada bloque conserva su error por separado. */
export interface IVistaInicioProfe {
  hoy: Seccion<{ clases: IClaseHoy[]; destacada: IClaseHoy | null }>;
  asistencias: Seccion<{
    lista: IResponseAsistenciaPendiente[];
    total: number;
  }>;
  tareas: Seccion<{ lista: IResponseTareaRevision[]; total: number }>;
  /** Mensajes sin leer (0 si no se pudo leer), también para la insignia de Mensajes. */
  noLeidos: number;
  noLeidosOk: boolean;
}

/** Arma la vista del inicio del profe con el instante `ahoraMs`. */
export function construirVistaInicioProfe(
  resumen: IResumenInicioProfe,
  idProfe: string,
  ahoraMs: number,
  sinNombre: string,
): IVistaInicioProfe {
  const { clases, estudiantes, asistencias, tareas, noLeidos } = resumen;
  const hoy = clases.ok
    ? clasesDeHoy(
        clases.datos,
        estudiantes.ok ? estudiantes.datos : [],
        idProfe,
        ahoraMs,
        sinNombre,
      )
    : null;
  return {
    hoy: hoy
      ? { ok: true, datos: { clases: hoy, destacada: claseDestacada(hoy) } }
      : (clases as Seccion<never>),
    asistencias: asistencias.ok
      ? {
          ok: true,
          datos: {
            lista: asistencias.datos.slice(0, 3),
            total: asistencias.datos.length,
          },
        }
      : asistencias,
    tareas: tareas.ok
      ? { ok: true, datos: tareasPorRevisar(tareas.datos) }
      : tareas,
    noLeidos: noLeidos.ok ? noLeidos.datos : 0,
    noLeidosOk: noLeidos.ok,
  };
}
