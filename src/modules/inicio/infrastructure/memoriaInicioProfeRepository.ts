import { respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseAsistenciaPendiente,
  IResponseClaseProfe,
  IResponseEstudianteProfe,
  IResponseTareaRevision,
} from '../domain/entities/InicioProfe.entities';
import type { InicioProfeRepository } from '../domain/models/InicioProfeRepository';

export interface IDatosMemoriaInicioProfe {
  clases?: IResponseClaseProfe[];
  estudiantes?: IResponseEstudianteProfe[];
  asistencias?: IResponseAsistenciaPendiente[];
  tareas?: IResponseTareaRevision[];
  noLeidos?: number;
}

/** Puerto en memoria para pruebas. Vacío por defecto: el inicio pinta sus estados vacíos. */
export function crearMemoriaInicioProfeRepository(
  datos: IDatosMemoriaInicioProfe = {},
): InicioProfeRepository {
  return {
    listarClases: async () => respuestaOk(datos.clases ?? []),
    listarEstudiantes: async () => respuestaOk(datos.estudiantes ?? []),
    listarAsistenciasPendientes: async () =>
      respuestaOk(datos.asistencias ?? []),
    listarTareas: async () => respuestaOk(datos.tareas ?? []),
    contarNoLeidos: async () => respuestaOk(datos.noLeidos ?? 0),
  };
}
