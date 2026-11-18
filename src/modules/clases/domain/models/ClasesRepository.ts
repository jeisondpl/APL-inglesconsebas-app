import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsCancelar,
  IArgsAgendar,
  IArgsClases,
  EstadoAgendar,
  IArgsReagendar,
  IResponseCancelacion,
  IResponseClase,
  EspaciosReagendar,
  VistaPreviaCancelacion,
} from '../entities/Clases.entities';

/** Puerto de Clases del estudiante: lo que puede leer y hacer con su sesión. */
export interface ClasesRepository {
  /** Todas sus clases (el ciclo actual y los anteriores). */
  listarClases(args: IArgsClases): Promise<HttpResponse<IResponseClase[]>>;
  /** Qué pasaría si cancela esta clase (Leap decide; no escribe nada). */
  vistaPreviaCancelacion(
    idClase: string,
  ): Promise<HttpResponse<VistaPreviaCancelacion>>;
  /** Cancela la clase. Leap calcula el estado y el costo. */
  cancelarClase(
    args: IArgsCancelar,
  ): Promise<HttpResponse<IResponseCancelacion>>;
  /** Espacios que puede escoger para una clase «por reagendar» (Leap ya los filtró). */
  espaciosParaReagendar(
    idClase: string,
  ): Promise<HttpResponse<EspaciosReagendar>>;
  /** Escoge el espacio. Leap vuelve a validar y crea el evento. */
  reagendarClase(args: IArgsReagendar): Promise<HttpResponse<{ ok: true }>>;
  /** Si el estudiante Flex puede agendar y cuántas clases le quedan (liviano: sin espacios). */
  estadoAgendar(idEstudiante: string): Promise<HttpResponse<EstadoAgendar>>;
  /** Espacios que puede escoger para agendar una clase nueva (Leap ya los filtró). */
  espaciosParaAgendar(
    idEstudiante: string,
  ): Promise<HttpResponse<EspaciosReagendar>>;
  /** Agenda la clase. Leap vuelve a validar y crea el evento. */
  agendarClase(args: IArgsAgendar): Promise<HttpResponse<{ ok: true }>>;
}
