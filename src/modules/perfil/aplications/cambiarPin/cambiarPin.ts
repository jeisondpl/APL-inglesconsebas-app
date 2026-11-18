import { respuestaError, type HttpResponse } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import {
  mensajesPerfil,
  problemaDelPin,
  type IArgsCambiarPin,
  type PerfilRepository,
} from '../../domain/perfil.dominio';

/**
 * Cambia el PIN propio. Valida lo que se puede validar sin red (4 dígitos, distinto, confirmado);
 * Leap vuelve a comprobar el PIN actual, que no esté en uso y el límite de intentos.
 */
export async function cambiarPinUseCase(
  repo: PerfilRepository,
  args: IArgsCambiarPin & { confirmar: string },
): Promise<HttpResponse<void>> {
  const problema = problemaDelPin(args.actual, args.nuevo, args.confirmar);
  if (problema) {
    return respuestaError(mensajesPerfil[problema]);
  }
  const r = await repo.cambiarPin({ actual: args.actual, nuevo: args.nuevo });
  return r.error && !r.msg
    ? respuestaError(textosComunes.errores.desconocido, r.code)
    : r;
}
