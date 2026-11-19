import { respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseFranjaHorario,
  IResponseMensaje,
  IResponsePlanEstudiante,
  IResponseSesionClase,
  IResponseTarea,
} from '../domain/entities/Inicio.entities';
import type { InicioRepository } from '../domain/models/InicioRepository';

export interface IDatosMemoriaInicio {
  plan?: IResponsePlanEstudiante;
  clases?: IResponseSesionClase[];
  horario?: IResponseFranjaHorario[];
  tareas?: IResponseTarea[];
  noLeidos?: number;
  mensajes?: IResponseMensaje[];
}

const PLAN_VACIO: IResponsePlanEstudiante = {
  plan: null,
  ciclo: null,
  cancelacionesUsadas: 0,
  cancelacionesMaximas: 0,
};

/**
 * Implementación en memoria del puerto, para pruebas y para el contenedor de pruebas. Por defecto
 * está vacía: el inicio pinta sus estados vacíos, nunca datos de ejemplo.
 */
export function crearMemoriaInicioRepository(
  datos: IDatosMemoriaInicio = {},
): InicioRepository {
  return {
    obtenerPlan: async () => respuestaOk(datos.plan ?? PLAN_VACIO),
    listarClases: async () => respuestaOk(datos.clases ?? []),
    listarHorario: async () => respuestaOk(datos.horario ?? []),
    listarTareas: async () => respuestaOk(datos.tareas ?? []),
    contarNoLeidos: async () => respuestaOk(datos.noLeidos ?? 0),
    listarMensajes: async () => respuestaOk(datos.mensajes ?? []),
  };
}
