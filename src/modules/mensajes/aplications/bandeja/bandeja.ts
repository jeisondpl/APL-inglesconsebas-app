import type { HttpResponse } from '@/shared/lib/HttpResponse';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type { IResponseBandeja } from '../../domain/entities/Mensajes.entities';
import type { MensajesRepository } from '../../domain/models/MensajesRepository';

/** Bandeja del profe: sus estudiantes, la conversación más reciente primero. */
export async function obtenerBandejaUseCase(
  repo: MensajesRepository,
): Promise<HttpResponse<IResponseBandeja>> {
  const r = await repo.bandeja();
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
