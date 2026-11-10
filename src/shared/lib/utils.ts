import type { HttpResponse } from './HttpResponse';

/** Parámetros de query string. Los `undefined` se omiten. */
export type ParametrosQuery = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * Construye la query string (con `?` inicial) a partir de un objeto. Devuelve '' si no hay
 * parámetros. Leap enruta por `?endpoint=&action=` (api.php).
 */
export function construirQuery(params?: ParametrosQuery): string {
  if (!params) {
    return '';
  }
  const partes = Object.entries(params)
    .filter(([, valor]) => valor !== undefined)
    .map(
      ([clave, valor]) =>
        `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`,
    );
  return partes.length ? `?${partes.join('&')}` : '';
}

const esHttpResponse = (valor: unknown): valor is HttpResponse<unknown> =>
  typeof valor === 'object' &&
  valor !== null &&
  'error' in valor &&
  typeof (valor as { error: unknown }).error === 'boolean';

/**
 * Extrae un mensaje legible de un error de cualquier forma: `HttpResponse`, `Error`, texto u otro
 * valor. Si no encuentra ninguno, devuelve `porDefecto`.
 */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  if (typeof err === 'string' && err.trim()) {
    return err;
  }
  if (esHttpResponse(err)) {
    return err.msg?.trim() ? err.msg : porDefecto;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return porDefecto;
}
