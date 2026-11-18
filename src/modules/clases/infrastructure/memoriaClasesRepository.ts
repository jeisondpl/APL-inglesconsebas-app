import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  EspaciosReagendar,
  IResponseCancelacion,
  IResponseClase,
  VistaPreviaCancelacion,
} from '../domain/entities/Clases.entities';
import type { ClasesRepository } from '../domain/models/ClasesRepository';

export interface IOpcionesMemoriaClases {
  /** Vista previa de la cancelación por id de clase. Sin dato: «no se puede cancelar». */
  vistasPrevias?: Record<string, VistaPreviaCancelacion>;
  /** Resultado de cancelar. Por defecto, el estado final de la vista previa. */
  cancelacion?: IResponseCancelacion;
  /** Espacios para reagendar por id de clase. Sin dato: «no se puede reagendar». */
  espacios?: Record<string, EspaciosReagendar>;
  /** Fuerza el error de reagendar (p. ej. el espacio se ocupó). */
  reagendarError?: { msg: string; code?: number };
}

/** Puerto en memoria para pruebas. Vacío por defecto: Clases pinta su estado vacío. */
export function crearMemoriaClasesRepository(
  clases: IResponseClase[] = [],
  opciones: IOpcionesMemoriaClases = {},
): ClasesRepository {
  return {
    listarClases: async () => respuestaOk(clases),
    vistaPreviaCancelacion: async idClase =>
      respuestaOk(
        opciones.vistasPrevias?.[idClase] ?? {
          puede: false,
          motivo: 'no_cancelable',
        },
      ),
    cancelarClase: async ({ idClase }) => {
      const vista = opciones.vistasPrevias?.[idClase];
      if (opciones.cancelacion) {
        return respuestaOk(opciones.cancelacion);
      }
      return vista && vista.puede
        ? respuestaOk({ estadoFinal: vista.estadoFinal })
        : respuestaError('Esta clase ya no se puede cancelar.', 409);
    },
    espaciosParaReagendar: async idClase =>
      respuestaOk(
        opciones.espacios?.[idClase] ?? {
          puede: false,
          motivo: 'no_reagendable',
        },
      ),
    reagendarClase: async ({ idClase, fecha, hora, idProfe }) => {
      if (opciones.reagendarError) {
        return respuestaError(
          opciones.reagendarError.msg,
          opciones.reagendarError.code,
        );
      }
      const datos = opciones.espacios?.[idClase];
      const existe =
        datos?.puede === true &&
        datos.espacios.some(
          e => e.fecha === fecha && e.hora === hora && e.idProfe === idProfe,
        );
      return existe
        ? respuestaOk({ ok: true as const })
        : respuestaError('Ese espacio ya no está disponible. Elige otro.', 409);
    },
  };
}
