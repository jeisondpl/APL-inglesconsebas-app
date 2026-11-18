import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesClases } from '../../domain/clases.mensajes';
import type {
  EspaciosReagendar,
  EstadoAgendar,
  IArgsAgendar,
} from '../../domain/entities/Clases.entities';
import type { ClasesRepository } from '../../domain/models/ClasesRepository';

/** Estado de agendar. Un error sin mensaje se convierte en el genérico. */
export async function estadoAgendarUseCase(
  repo: ClasesRepository,
  idEstudiante: string,
): Promise<HttpResponse<EstadoAgendar>> {
  const r = await repo.estadoAgendar(idEstudiante);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

/** Espacios que puede escoger para agendar. */
export async function espaciosParaAgendarUseCase(
  repo: ClasesRepository,
  idEstudiante: string,
): Promise<HttpResponse<EspaciosReagendar>> {
  const r = await repo.espaciosParaAgendar(idEstudiante);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}

/**
 * Agenda la clase. Solo deja pasar un espacio de la lista que dio Leap; Leap vuelve a validar todo
 * (cupo, pago, fin del ciclo, anticipación).
 */
export async function agendarClaseUseCase(
  repo: ClasesRepository,
  args: IArgsAgendar,
  datos: EspaciosReagendar,
): Promise<HttpResponse<{ ok: true }>> {
  if (!datos.puede) {
    return respuestaError(mensajesClases.noSeAgendo);
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
  const r = await repo.agendarClase(args);
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
