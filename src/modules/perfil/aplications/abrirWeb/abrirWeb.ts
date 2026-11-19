import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import {
  mensajesPerfil,
  type PerfilRepository,
} from '../../domain/perfil.dominio';

/**
 * Abre la web de Leap con la sesión de la App (1.16): pide un código de un solo uso (60 s) y abre el
 * navegador en `<web>/?app_code=…`, donde la web lo canjea por su propia sesión. Si no se puede
 * pedir el código o abrir el navegador, lo dice; nunca lanza.
 */
export async function abrirWebUseCase(
  repo: PerfilRepository,
  enlaces: EnlacesPort,
  webUrl: string,
): Promise<HttpResponse<void>> {
  const r = await repo.codigoWeb();
  if (r.error || !r.response) {
    return respuestaError(r.msg || textosComunes.errores.desconocido, r.code);
  }
  const abierto = await enlaces.abrir(
    `${webUrl}/?app_code=${encodeURIComponent(r.response.codigo)}`,
  );
  return abierto
    ? respuestaOk(undefined)
    : respuestaError(mensajesPerfil.sinNavegador);
}
