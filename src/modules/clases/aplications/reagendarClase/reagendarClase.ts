import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesClases } from '../../domain/clases.mensajes';
import type {
  EspaciosReagendar,
  IArgsReagendar,
} from '../../domain/entities/Clases.entities';
import type { ClasesRepository } from '../../domain/models/ClasesRepository';

/** Espacios que puede escoger. Un error sin mensaje se convierte en el genérico. */
export async function espaciosParaReagendarUseCase(
  repo: ClasesRepository,
  idClase: string,
): Promise<HttpResponse<EspaciosReagendar>> {
  const r = await repo.espaciosParaReagendar(idClase);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

/**
 * Reagenda la clase. Solo deja pasar un espacio de la lista que dio Leap: así no se manda una
 * fecha inventada. Leap vuelve a validar todo (anticipación, plazo, cruces).
 */
export async function reagendarClaseUseCase(
  repo: ClasesRepository,
  args: IArgsReagendar,
  datos: EspaciosReagendar,
): Promise<HttpResponse<{ ok: true }>> {
  if (!datos.puede) {
    return respuestaError(mensajesClases.noSePuedeReagendar);
  }
  const existe = datos.espacios.some(
    e =>
      e.fecha === args.fecha &&
      e.hora === args.hora &&
      e.idProfe === args.idProfe,
  );
  if (!existe) {
    return respuestaError(mensajesClases.eligeEspacio);
  }
  const r = await repo.reagendarClase(args);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
