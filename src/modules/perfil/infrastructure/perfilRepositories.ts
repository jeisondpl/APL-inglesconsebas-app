import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IArgsCambiarPin,
  PerfilRepository,
} from '../domain/perfil.dominio';

/** Adaptador de `auth.php?action=change_pin`. Nunca lanza; el PIN no se registra en ningún log. */
export function crearApiPerfilRepository(api: ClienteApi): PerfilRepository {
  return {
    async codigoWeb() {
      const r = await api.post<unknown>('auth.php', {}, { action: 'web_code' });
      if (r.error) {
        return respuestaError(
          r.msg ?? textosComunes.errores.desconocido,
          r.code,
        );
      }
      const d = r.response as { code?: unknown } | undefined;
      return typeof d?.code === 'string' && d.code !== ''
        ? respuestaOk({ codigo: d.code }, r.code)
        : respuestaError(textosComunes.errores.respuestaInvalida, r.code);
    },
    async cambiarPin({ actual, nuevo }) {
      const r = await api.post<unknown>(
        'auth.php',
        { currentPin: actual, newPin: nuevo },
        { action: 'change_pin' },
      );
      return r.error
        ? respuestaError(r.msg ?? textosComunes.errores.desconocido, r.code)
        : respuestaOk(undefined, r.code);
    },
  };
}

export interface IMemoriaPerfil extends PerfilRepository {
  /** Cuántos códigos de web se pidieron. */
  codigosPedidos: number;
  /** Lo que se mandó a cambiar, en orden. */
  cambios: IArgsCambiarPin[];
}

/**
 * Puerto en memoria para pruebas. `pinActual` es el PIN vigente (otro da «PIN actual incorrecto»);
 * `falla` fuerza el error del siguiente intento.
 */
export function crearMemoriaPerfilRepository(
  opciones: { pinActual?: string; falla?: { msg: string; code?: number } } = {},
): IMemoriaPerfil {
  let pin = opciones.pinActual ?? '1234';
  const cambios: IArgsCambiarPin[] = [];
  const memoria: IMemoriaPerfil = {
    cambios,
    codigosPedidos: 0,
    async codigoWeb() {
      memoria.codigosPedidos += 1;
      return opciones.falla
        ? respuestaError(opciones.falla.msg, opciones.falla.code)
        : respuestaOk({ codigo: 'CODIGO-MEMORIA' });
    },
    async cambiarPin(args): Promise<HttpResponse<void>> {
      if (opciones.falla) {
        return respuestaError(opciones.falla.msg, opciones.falla.code);
      }
      if (args.actual !== pin) {
        return respuestaError('El PIN actual no es correcto.', 403);
      }
      pin = args.nuevo;
      cambios.push(args);
      return respuestaOk(undefined);
    },
  };
  return memoria;
}
