import type { HttpResponse } from '@/shared/lib/HttpResponse';

export interface IResponseCodigoWeb {
  /** Código de un solo uso (60 s) que la web canjea por una sesión. */
  codigo: string;
}

export interface IArgsCambiarPin {
  actual: string;
  nuevo: string;
}

/** Puerto remoto del perfil (auth.php de Leap, `change_pin`). La persona sale de la sesión. */
export interface PerfilRepository {
  /** Cambia el PIN propio. Leap pide el actual y cierra las demás sesiones de la persona. */
  cambiarPin(args: IArgsCambiarPin): Promise<HttpResponse<void>>;
  /** Pide un código para entrar a la web sin escribir el PIN (`web_code`, F1-02B). */
  codigoWeb(): Promise<HttpResponse<IResponseCodigoWeb>>;
}

/** El PIN de la academia tiene 4 dígitos. */
export const LARGO_PIN = 4;

export type ProblemaPin =
  | 'actualIncompleto'
  | 'nuevoIncompleto'
  | 'igual'
  | 'noCoincide';

export const mensajesPerfil = {
  actualIncompleto: 'Escribe tu PIN actual (4 dígitos).',
  nuevoIncompleto: 'El PIN nuevo debe tener 4 dígitos.',
  igual: 'El PIN nuevo debe ser distinto al actual.',
  noCoincide: 'La confirmación no coincide con el PIN nuevo.',
  pinCambiado: 'PIN cambiado',
  pinCambiadoDetalle:
    'Tus otros dispositivos tendrán que iniciar sesión de nuevo.',
  noSeCambio: 'No se cambió el PIN',
  noSePudoWeb: 'No pudimos abrir la web',
  sinNavegador: 'No encontramos un navegador para abrir la web.',
} as const;

/** Deja solo dígitos y corta a 4: lo que se escribe en los campos de PIN. */
export const soloPin = (texto: string): string =>
  texto.replace(/\D/g, '').slice(0, LARGO_PIN);

const esPin = (v: string): boolean => /^\d{4}$/.test(v);

/** Primer problema de los tres campos, o `null` si se puede enviar. */
export function problemaDelPin(
  actual: string,
  nuevo: string,
  confirmar: string,
): ProblemaPin | null {
  if (!esPin(actual)) {
    return 'actualIncompleto';
  }
  if (!esPin(nuevo)) {
    return 'nuevoIncompleto';
  }
  if (nuevo === actual) {
    return 'igual';
  }
  return nuevo === confirmar ? null : 'noCoincide';
}
