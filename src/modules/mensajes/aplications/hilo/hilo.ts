import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesChat } from '../../domain/mensajes.mensajes';
import type {
  IArgsEnviar,
  IArgsHilo,
  IArgsReaccion,
  IResponseHilo,
  IResponseMensaje,
  Reacciones,
} from '../../domain/entities/Mensajes.entities';
import type { MensajesRepository } from '../../domain/models/MensajesRepository';
import {
  EMOJIS_REACCION,
  MAX_TEXTO,
  normalizarEmoji,
  problemaDelTexto,
} from '../../domain/validations/mensajes.validations';

/** Un error sin mensaje se convierte en el genérico; el servidor decide lo demás. */
function conMensaje<T>(r: HttpResponse<T>): HttpResponse<T> {
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

/** Mensajes nuevos del hilo (sondeo incremental) con el estado de los últimos. */
export async function obtenerHiloUseCase(
  repo: MensajesRepository,
  args: IArgsHilo,
): Promise<HttpResponse<IResponseHilo>> {
  if (!args.idEstudiante) {
    return respuestaError(mensajesChat.sinEstudiante);
  }
  return conMensaje(await repo.hilo(args));
}

/**
 * Envía un mensaje. Con voz o imagen el texto puede ir vacío; sin ellas debe haber texto. El
 * servidor vuelve a validar y decide quién es el remitente.
 */
export async function enviarMensajeUseCase(
  repo: MensajesRepository,
  args: IArgsEnviar,
): Promise<HttpResponse<IResponseMensaje>> {
  if (!args.idEstudiante) {
    return respuestaError(mensajesChat.sinEstudiante);
  }
  const traeMedia = Boolean(args.imagen || args.voz);
  const problema = problemaDelTexto(args.texto);
  if (problema === 'largo') {
    return respuestaError(mensajesChat.textoLargo(MAX_TEXTO));
  }
  if (problema === 'vacio' && !traeMedia) {
    return respuestaError(mensajesChat.textoVacio);
  }
  return conMensaje(await repo.enviar({ ...args, texto: args.texto.trim() }));
}

export async function marcarLeidoUseCase(
  repo: MensajesRepository,
  idEstudiante: string,
): Promise<HttpResponse<{ marcados: number }>> {
  if (!idEstudiante) {
    return respuestaError(mensajesChat.sinEstudiante);
  }
  return conMensaje(await repo.marcarLeido(idEstudiante));
}

export async function reaccionarUseCase(
  repo: MensajesRepository,
  args: IArgsReaccion,
): Promise<HttpResponse<Reacciones>> {
  const emoji = normalizarEmoji(args.emoji);
  if (!(EMOJIS_REACCION as readonly string[]).includes(emoji)) {
    return respuestaError(mensajesChat.reaccionInvalida);
  }
  return conMensaje(await repo.reaccionar({ id: args.id, emoji }));
}
