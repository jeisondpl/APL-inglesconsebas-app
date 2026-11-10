/**
 * Respuesta unificada entre capas (docs/ARQUITECTURA.md § 3). Los adaptadores convierten cualquier
 * respuesta cruda (HTTP, nativa o local) a esta forma y nunca lanzan excepciones.
 */
export interface HttpResponse<T> {
  error: boolean;
  response?: T;
  msg?: string;
  code?: number;
}

/** Respuesta correcta con su cuerpo y, si se conoce, el estado HTTP. */
export const respuestaOk = <T>(
  response: T,
  code?: number,
): HttpResponse<T> => ({
  error: false,
  response,
  code,
});

/** Respuesta de error con un mensaje legible para la persona usuaria. */
export const respuestaError = <T = never>(
  msg: string,
  code?: number,
): HttpResponse<T> => ({
  error: true,
  msg,
  code,
});
