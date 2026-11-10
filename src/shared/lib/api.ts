import { respuestaError, respuestaOk, type HttpResponse } from './HttpResponse';
import { textosComunes } from './textos';
import { construirQuery, type ParametrosQuery } from './utils';

export type { ParametrosQuery } from './utils';

/**
 * Opciones del cliente HTTP. La sesión no vive aquí: el contenedor de dependencias (src/app/di)
 * inyecta `obtenerToken` y `alNoAutorizado`, y la feature de sesión solo cambiará esas dos funciones.
 */
export interface IOpcionesClienteApi {
  urlBase: string;
  /** Token para la cabecera `Authorization: Bearer`. Sin token (null) la petición va sin cabecera. */
  obtenerToken?: () => Promise<string | null>;
  /** Se llama una vez por cada respuesta 401 (sesión caducada o inválida). */
  alNoAutorizado?: () => void;
  /** Tiempo máximo de espera por petición. 15 000 ms por defecto. */
  tiempoLimiteMs?: number;
  /** Implementación de fetch. Se inyecta en los tests. */
  fetchImpl?: typeof fetch;
}

/** Cliente HTTP de la API de Leap. Leap solo acepta GET y POST (config.php). Nunca lanza. */
export interface ClienteApi {
  get<T>(ruta: string, params?: ParametrosQuery): Promise<HttpResponse<T>>;
  post<T>(
    ruta: string,
    cuerpo?: unknown,
    params?: ParametrosQuery,
  ): Promise<HttpResponse<T>>;
}

const TIEMPO_LIMITE_POR_DEFECTO = 15000;
/** Código de las respuestas sin estado HTTP: fallo de red o tiempo agotado. */
const SIN_RESPUESTA = 0;
const AGOTADO = Symbol('tiempo-agotado');

/** Une la URL base, la ruta y la query sin duplicar barras ni signos de interrogación. */
function construirUrl(
  urlBase: string,
  ruta: string,
  params?: ParametrosQuery,
): string {
  const base = urlBase.replace(/\/+$/, '');
  const camino = ruta ? `/${ruta.replace(/^\/+/, '')}` : '';
  const query = construirQuery(params);
  const unida = `${base}${camino}`;
  if (!query) {
    return unida;
  }
  return unida.includes('?')
    ? `${unida}&${query.slice(1)}`
    : `${unida}${query}`;
}

/** Interpreta el cuerpo como JSON. Devuelve `undefined` si viene vacío y lanza si no es JSON. */
function interpretarCuerpo(texto: string): unknown {
  return texto.trim() ? JSON.parse(texto) : undefined;
}

/** Extrae el `{ "error": "<msg>" }` con el que responde Leap (config.php, respondError). */
function mensajeDeLeap(cuerpo: unknown): string | undefined {
  if (typeof cuerpo === 'object' && cuerpo !== null && 'error' in cuerpo) {
    const { error } = cuerpo as { error: unknown };
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
  }
  return undefined;
}

function mensajePorEstado(estado: number): string {
  if (estado === 401) {
    return textosComunes.errores.noAutorizado;
  }
  if (estado >= 500) {
    return textosComunes.errores.servidor;
  }
  return textosComunes.errores.desconocido;
}

export function crearClienteApi(opciones: IOpcionesClienteApi): ClienteApi {
  const {
    urlBase,
    obtenerToken = () => Promise.resolve(null),
    alNoAutorizado = () => {},
    tiempoLimiteMs = TIEMPO_LIMITE_POR_DEFECTO,
  } = opciones;

  async function token(): Promise<string | null> {
    try {
      return await obtenerToken();
    } catch {
      // Si no se puede leer el token, la petición sale sin él y el backend decide (401).
      return null;
    }
  }

  async function peticion<T>(
    metodo: 'GET' | 'POST',
    ruta: string,
    cuerpo: unknown,
    params?: ParametrosQuery,
  ): Promise<HttpResponse<T>> {
    const fetchImpl = opciones.fetchImpl ?? fetch;
    const cabeceras: Record<string, string> = { Accept: 'application/json' };
    const bearer = await token();
    if (bearer) {
      cabeceras.Authorization = `Bearer ${bearer}`;
    }
    let cuerpoJson: string | undefined;
    if (metodo === 'POST' && cuerpo !== undefined) {
      cabeceras['Content-Type'] = 'application/json';
      cuerpoJson = JSON.stringify(cuerpo);
    }

    const controlador = new AbortController();
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const tiempoAgotado = new Promise<typeof AGOTADO>(resolver => {
      temporizador = setTimeout(() => {
        controlador.abort();
        resolver(AGOTADO);
      }, tiempoLimiteMs);
    });

    try {
      const respuesta = await Promise.race([
        fetchImpl(construirUrl(urlBase, ruta, params), {
          method: metodo,
          headers: cabeceras,
          body: cuerpoJson,
          signal: controlador.signal,
        }),
        tiempoAgotado,
      ]);
      if (respuesta === AGOTADO) {
        return respuestaError<T>(
          textosComunes.errores.tiempoAgotado,
          SIN_RESPUESTA,
        );
      }

      const estado = respuesta.status;
      if (estado === 401) {
        alNoAutorizado();
      }

      let datos: unknown;
      try {
        datos = interpretarCuerpo(await respuesta.text());
      } catch {
        return respuestaError<T>(
          respuesta.ok
            ? textosComunes.errores.respuestaInvalida
            : mensajePorEstado(estado),
          estado,
        );
      }

      if (!respuesta.ok) {
        return respuestaError<T>(
          mensajeDeLeap(datos) ?? mensajePorEstado(estado),
          estado,
        );
      }
      return respuestaOk(datos as T, estado);
    } catch {
      // fetch rechaza por falta de red, DNS o aborto: no hay estado HTTP.
      return respuestaError<T>(textosComunes.errores.red, SIN_RESPUESTA);
    } finally {
      clearTimeout(temporizador);
    }
  }

  return {
    get: <T>(ruta: string, params?: ParametrosQuery) =>
      peticion<T>('GET', ruta, undefined, params),
    post: <T>(ruta: string, cuerpo?: unknown, params?: ParametrosQuery) =>
      peticion<T>('POST', ruta, cuerpo, params),
  };
}
