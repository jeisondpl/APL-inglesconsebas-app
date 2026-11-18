import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  IArgsEnviar,
  IArgsHilo,
  IArgsReaccion,
  IResponseBandeja,
  IResponseHilo,
  IResponseMensaje,
  Reacciones,
} from '../entities/Mensajes.entities';

/** Puerto del chat estudiante–profe. Leap decide el remitente, la propiedad del hilo y el «leído». */
export interface MensajesRepository {
  /** Mensajes nuevos de un hilo y el estado de los últimos (sondeo liviano). */
  hilo(args: IArgsHilo): Promise<HttpResponse<IResponseHilo>>;
  enviar(args: IArgsEnviar): Promise<HttpResponse<IResponseMensaje>>;
  /** Marca como leídos los mensajes del otro lado. */
  marcarLeido(
    idEstudiante: string,
  ): Promise<HttpResponse<{ marcados: number }>>;
  /** Pone o quita (mismo emoji) la reacción de quien tiene la sesión. */
  reaccionar(args: IArgsReaccion): Promise<HttpResponse<Reacciones>>;
  /** Solo profe: sus estudiantes con el último mensaje y los no leídos. */
  bandeja(): Promise<HttpResponse<IResponseBandeja>>;
}
