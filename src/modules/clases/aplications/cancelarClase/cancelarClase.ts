import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesClases } from '../../domain/clases.mensajes';
import type {
  IArgsCancelar,
  IResponseCancelacion,
  VistaPreviaCancelacion,
} from '../../domain/entities/Clases.entities';
import type { ClasesRepository } from '../../domain/models/ClasesRepository';

/** Qué pasaría al cancelar. Un error sin mensaje se convierte en el genérico. */
export async function vistaPreviaCancelacionUseCase(
  repo: ClasesRepository,
  idClase: string,
): Promise<HttpResponse<VistaPreviaCancelacion>> {
  const r = await repo.vistaPreviaCancelacion(idClase);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

/**
 * Cancela la clase. Si Leap dejó elegir (`opciones`), exige una opción válida antes de llamar: así
 * no se manda una cancelación a medias. El estado y los tokens los decide Leap, no la App.
 */
export async function cancelarClaseUseCase(
  repo: ClasesRepository,
  args: IArgsCancelar,
  vista: VistaPreviaCancelacion,
): Promise<HttpResponse<IResponseCancelacion>> {
  if (!vista.puede) {
    return respuestaError(mensajesClases.noSePuedeCancelar);
  }
  if (
    vista.opciones.length > 0 &&
    !vista.opciones.some(o => o.opcion === args.opcion)
  ) {
    return respuestaError(mensajesClases.eligeOpcion);
  }
  const r = await repo.cancelarClase(args);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
