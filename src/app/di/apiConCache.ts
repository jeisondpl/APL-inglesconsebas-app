import type { CacheLocalPort } from '@/native/ports/CacheLocalPort';
import type { ClienteApi } from '@/shared/lib/api';
import type { EstadoConexion } from '@/shared/lib/conexion';
import { respuestaOk } from '@/shared/lib/HttpResponse';
import { construirQuery, type ParametrosQuery } from '@/shared/lib/utils';

/** Una respuesta más grande que esto no se guarda (listas con imágenes embebidas, p. ej.). */
export const MAX_CACHE_CARACTERES = 1000000;

/** Sin respuesta HTTP: sin red o tiempo agotado (ver `shared/lib/api.ts`). */
const SIN_RESPUESTA = 0;

export interface IOpcionesApiConCache {
  cache: CacheLocalPort;
  conexion: EstadoConexion;
  /** Id de la persona con sesión (la caché es por persona) o `null` sin sesión. */
  usuario: () => string | null;
}

/**
 * Qué lecturas se guardan: todo GET salvo el login/sesión (`auth.php` debe ver la verdad), el
 * contenido pesado bajo demanda (`view=media`) y el sondeo incremental del chat (`after_id` > 0).
 */
export function esCacheable(ruta: string, params?: ParametrosQuery): boolean {
  if (ruta.replace(/^\/+/, '').startsWith('auth.php')) {
    return false;
  }
  if (params?.view === 'media') {
    return false;
  }
  const despues = Number(params?.after_id ?? 0);
  return !(Number.isFinite(despues) && despues > 0);
}

/**
 * Envuelve el cliente HTTP (F1-03b, 1.15): cada lectura correcta se guarda en disco y, si más tarde
 * no hay conexión, se responde con lo último que se guardó. También deduce si hay conexión para el
 * aviso de «sin conexión». Las escrituras (POST) no se guardan ni se simulan: sin red fallan con su
 * mensaje de siempre. Nunca lanza.
 */
export function crearApiConCache(
  api: ClienteApi,
  { cache, conexion, usuario }: IOpcionesApiConCache,
): ClienteApi {
  const claveDe = (ruta: string, params?: ParametrosQuery) =>
    `${usuario()}|${ruta}${construirQuery(params)}`;

  return {
    async get<T>(ruta: string, params?: ParametrosQuery) {
      const r = await api.get<T>(ruta, params);
      const guardable = usuario() !== null && esCacheable(ruta, params);
      if (!r.error) {
        conexion.marcarEnLinea();
        if (guardable) {
          const texto = JSON.stringify({ datos: r.response });
          if (texto.length <= MAX_CACHE_CARACTERES) {
            cache.guardar(claveDe(ruta, params), texto);
          }
        }
        return r;
      }
      if (r.code !== SIN_RESPUESTA) {
        // Llegó al servidor (p. ej. 403, 500): hay conexión y el error es real.
        conexion.marcarEnLinea();
        return r;
      }
      conexion.marcarSinConexion();
      if (guardable) {
        const guardado = await cache.leer(claveDe(ruta, params));
        if (guardado) {
          try {
            const { datos } = JSON.parse(guardado) as { datos: T };
            conexion.marcarGuardado();
            return respuestaOk<T>(datos, SIN_RESPUESTA);
          } catch {
            // Archivo dañado: se ignora y se devuelve el error de red.
          }
        }
      }
      return r;
    },

    async post<T>(ruta: string, cuerpo?: unknown, params?: ParametrosQuery) {
      const r = await api.post<T>(ruta, cuerpo, params);
      if (!r.error || r.code !== SIN_RESPUESTA) {
        conexion.marcarEnLinea();
      } else {
        conexion.marcarSinConexion();
      }
      return r;
    },
  };
}
