import type {
  CuentaAtras,
  ICancelaciones,
  ICicloEstudiante,
  IProgresoCiclo,
  IProximaClase,
  IResponseMensaje,
  IResponseTarea,
  IResumenInicio,
  Seccion,
} from '../../domain/entities/Inicio.entities';
import {
  cancelacionesDisponibles,
  cuentaAtras,
  nombrePlan,
  progresoCiclo,
  proximaClase,
  tareasPendientes,
  ultimoMensaje,
} from '../../domain/validations/inicio.validations';

/** Lo que pinta la pantalla, ya calculado. Cada bloque conserva su error por separado. */
export interface IVistaInicio {
  plan: Seccion<{
    nombre: string | null;
    ciclo: ICicloEstudiante | null;
    cancelaciones: ICancelaciones;
  }>;
  proximaClase: Seccion<{
    clase: IProximaClase | null;
    cuentaAtras: CuentaAtras | null;
  }>;
  ciclo: Seccion<IProgresoCiclo>;
  tareas: Seccion<{ lista: IResponseTarea[]; total: number }>;
  mensajes: Seccion<{
    ultimo: IResponseMensaje | null;
    noLeidos: number | null;
  }>;
  /** No leídos para la insignia de la pestaña Mensajes (0 si no se pudo leer). */
  noLeidos: number;
}

/** Arma la vista del inicio con los cálculos del dominio y el instante `ahoraMs`. */
export function construirVistaInicio(
  resumen: IResumenInicio,
  ahoraMs: number,
): IVistaInicio {
  const { plan, clases, horario, tareas, noLeidos, mensajes } = resumen;
  const paquete = plan.ok ? plan.datos.plan : null;
  const franjas = horario.ok ? horario.datos : [];
  const proxima = clases.ok
    ? proximaClase(clases.datos, franjas, ahoraMs)
    : null;
  const cantidadNoLeidos = noLeidos.ok ? noLeidos.datos : null;

  return {
    plan: plan.ok
      ? {
          ok: true,
          datos: {
            nombre: nombrePlan(plan.datos.plan),
            ciclo: plan.datos.ciclo,
            cancelaciones: cancelacionesDisponibles(plan.datos),
          },
        }
      : plan,
    proximaClase: clases.ok
      ? {
          ok: true,
          datos: {
            clase: proxima,
            cuentaAtras: proxima
              ? cuentaAtras(proxima.inicioMs, ahoraMs)
              : null,
          },
        }
      : clases,
    ciclo: clases.ok
      ? { ok: true, datos: progresoCiclo(clases.datos, paquete, ahoraMs) }
      : clases,
    tareas: tareas.ok
      ? { ok: true, datos: tareasPendientes(tareas.datos) }
      : tareas,
    mensajes: mensajes.ok
      ? {
          ok: true,
          datos: {
            ultimo: ultimoMensaje(mensajes.datos),
            noLeidos: cantidadNoLeidos,
          },
        }
      : mensajes,
    noLeidos: cantidadNoLeidos ?? 0,
  };
}
