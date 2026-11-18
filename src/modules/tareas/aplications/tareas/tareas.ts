import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsEntregar,
  IArgsRevisar,
  IResponseListaTareas,
  IResponseMediaTarea,
  SlotTarea,
} from '../../domain/entities/Tareas.entities';
import type { TareasRepository } from '../../domain/models/TareasRepository';
import { mensajesTareas } from '../../domain/tareas.mensajes';
import {
  limpiar,
  MAX_COMENTARIO,
  MAX_NOTA,
  MAX_TEXTO_ENTREGA,
  MAX_VOZ,
} from '../../domain/validations/tareas.validations';

/** Un error sin mensaje se convierte en el genérico; el servidor decide lo demás. */
function conMensaje<T>(r: HttpResponse<T>): HttpResponse<T> {
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

export async function obtenerTareasUseCase(
  repo: TareasRepository,
): Promise<HttpResponse<IResponseListaTareas>> {
  return conMensaje(await repo.listar());
}

export async function obtenerMediaTareaUseCase(
  repo: TareasRepository,
  id: number,
  slot: SlotTarea,
): Promise<HttpResponse<IResponseMediaTarea>> {
  if (!(id > 0)) {
    return respuestaError(mensajesTareas.sinTarea);
  }
  return conMensaje(await repo.media(id, slot));
}

/** Entrega con texto, voz o ambos; el servidor vuelve a validar propiedad y estado. */
export async function entregarTareaUseCase(
  repo: TareasRepository,
  args: IArgsEntregar,
): Promise<HttpResponse<void>> {
  if (!(args.id > 0)) {
    return respuestaError(mensajesTareas.sinTarea);
  }
  const texto = limpiar(args.texto);
  if (texto === '' && !args.voz) {
    return respuestaError(mensajesTareas.respuestaVacia);
  }
  if (texto.length > MAX_TEXTO_ENTREGA) {
    return respuestaError(mensajesTareas.respuestaLarga(MAX_TEXTO_ENTREGA));
  }
  if (args.voz && args.voz.length > MAX_VOZ) {
    return respuestaError(mensajesTareas.vozGrande);
  }
  return conMensaje(await repo.entregar({ ...args, texto }));
}

/** Feedback de la profe: comentario, nota y/o voz (al menos uno). */
export async function revisarTareaUseCase(
  repo: TareasRepository,
  args: IArgsRevisar,
): Promise<HttpResponse<void>> {
  if (!(args.id > 0)) {
    return respuestaError(mensajesTareas.sinTarea);
  }
  const comentario = limpiar(args.comentario);
  const nota = limpiar(args.nota);
  if (comentario === '' && nota === '' && !args.voz) {
    return respuestaError(mensajesTareas.feedbackVacio);
  }
  if (comentario.length > MAX_COMENTARIO) {
    return respuestaError(mensajesTareas.comentarioLargo(MAX_COMENTARIO));
  }
  if (nota.length > MAX_NOTA) {
    return respuestaError(mensajesTareas.notaLarga(MAX_NOTA));
  }
  if (args.voz && args.voz.length > MAX_VOZ) {
    return respuestaError(mensajesTareas.vozGrande);
  }
  return conMensaje(await repo.revisar({ ...args, comentario, nota }));
}

export async function marcarFeedbackVistoUseCase(
  repo: TareasRepository,
  id: number,
): Promise<HttpResponse<void>> {
  if (!(id > 0)) {
    return respuestaError(mensajesTareas.sinTarea);
  }
  return conMensaje(await repo.marcarFeedbackVisto(id));
}
