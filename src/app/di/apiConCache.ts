import type { CacheLocalPort } from '@/native/ports/CacheLocalPort';
import type { ClienteApi } from '@/shared/lib/api';
import type { EstadoConexion } from '@/shared/lib/conexion';
import { respuestaOk, type HttpResponse } from '@/shared/lib/HttpResponse';
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
 * Lecturas que Leap hace por POST (no cambian nada) y que también se guardan: las asistencias por
 * marcar del inicio de la profe y del admin, y los mensajes sin leer y el último hilo del inicio
 * (`chispa`), que sin esto desaparecían del inicio de la profe sin conexión. El resto de POST son
 * escrituras o vistas previas que deben ver el estado real (cancelar, reagendar, espacios Flex).
 */
export const LECTURAS_POST: ReadonlySet<string> = new Set([
  'pending_attendance',
  'pending_attendance_admin',
  'get_unread',
  'get_thread',
]);

export function esLecturaPost(cuerpo: unknown): boolean {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return false;
  }
  const accion = (cuerpo as { action?: unknown }).action;
  return typeof accion === 'string' && LECTURAS_POST.has(accion);
}

/**
 * Envuelve el cliente HTTP (F1-03b, 1.15): cada lectura correcta se guarda en disco y, si más tarde
 * no hay conexión, se responde con lo último que se guardó. También deduce si hay conexión para el
 * aviso de «sin conexión». Las escrituras (POST) no se guardan ni se simulan: sin red fallan con su
 * mensaje de siempre, salvo las `LECTURAS_POST`, que se tratan como un GET. Nunca lanza.
 */
export function crearApiConCache(
  api: ClienteApi,
  { cache, conexion, usuario }: IOpcionesApiConCache,
): ClienteApi {
  const claveDe = (ruta: string, params?: ParametrosQuery) =>
    `${usuario()}|${ruta}${construirQuery(params)}`;

  /** Lectura con respaldo en disco: guarda lo correcto y, sin respuesta, responde lo guardado. */
  async function leerConRespaldo<T>(
    pedir: () => Promise<HttpResponse<T>>,
    clave: string | null,
  ): Promise<HttpResponse<T>> {
    const r = await pedir();
    if (!r.error) {
      conexion.marcarEnLinea();
      if (clave) {
        const texto = JSON.stringify({ datos: r.response });
        if (texto.length <= MAX_CACHE_CARACTERES) {
          cache.guardar(clave, texto);
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
    if (clave) {
      const guardado = await cache.leer(clave);
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
  }

  return {
    get<T>(ruta: string, params?: ParametrosQuery) {
      const guardable = usuario() !== null && esCacheable(ruta, params);
      return leerConRespaldo<T>(
        () => api.get<T>(ruta, params),
        guardable ? claveDe(ruta, params) : null,
      );
    },

    async post<T>(ruta: string, cuerpo?: unknown, params?: ParametrosQuery) {
      if (usuario() !== null && esLecturaPost(cuerpo)) {
        return leerConRespaldo<T>(
          () => api.post<T>(ruta, cuerpo, params),
          `POST|${claveDe(ruta, params)}|${JSON.stringify(cuerpo)}`,
        );
      }
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
