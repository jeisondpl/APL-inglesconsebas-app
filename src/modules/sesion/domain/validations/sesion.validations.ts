import type {
  IDesafioCodigo,
  IResponseSesion,
  ISesionGuardada,
  ResultadoLogin,
  RolUsuario,
} from '../entities/Sesion.entities';
import { mensajesSesion } from '../sesion.mensajes';

export const LONGITUD_PIN = 4;
/** Dígitos del código por correo (doble factor, F1-06). Igual que CODIGO_LONGITUD de Leap. */
export const LONGITUD_CODIGO = 6;
/** Clave del almacén seguro donde se guarda la sesión. */
export const CLAVE_SESION = 'sesion';
/** Espera máxima por el logout del servidor antes de cerrar en local. */
export const LIMITE_CIERRE_REMOTO_MS = 3000;
/** WhatsApp de la academia para la ayuda del PIN (el mismo de la web). */
export const TELEFONO_WHATSAPP = '573205571518';

const ROLES: readonly RolUsuario[] = ['estudiante', 'profe', 'admin'];

/** Igual que auth.php: sin espacios alrededor y en minúsculas. */
export function normalizarUsuario(texto: string): string {
  return texto.trim().toLowerCase();
}

/** Mensaje de error si el usuario está vacío tras normalizar; `null` si es válido. */
export function validarUsuario(texto: string): string | null {
  return normalizarUsuario(texto) ? null : mensajesSesion.usuarioVacio;
}

/** Mensaje de error si el PIN no son exactamente 4 dígitos; `null` si es válido. */
export function validarPin(pin: string): string | null {
  return /^\d{4}$/.test(pin) ? null : mensajesSesion.pinInvalido;
}

/** Mensaje de error si el código no son exactamente 6 dígitos; `null` si es válido. */
export function validarCodigo(codigo: string): string | null {
  return /^\d+$/.test(codigo) && codigo.length === LONGITUD_CODIGO
    ? null
    : mensajesSesion.codigoInvalido;
}

/** ¿El login pidió el código por correo en vez de dar la sesión? */
export function esDesafio(
  resultado: ResultadoLogin,
): resultado is IDesafioCodigo {
  return 'requiereCodigo' in resultado && resultado.requiereCodigo === true;
}

/** Añade un dígito sin pasar de `maximo` (el PIN por defecto). Lo que no sea un dígito se ignora. */
export function agregarDigito(
  pin: string,
  digito: string,
  maximo: number = LONGITUD_PIN,
): string {
  if (pin.length >= maximo || !/^\d$/.test(digito)) {
    return pin;
  }
  return pin + digito;
}

/** Quita el último dígito del PIN. */
export function quitarDigito(pin: string): string {
  return pin.slice(0, -1);
}

const instante = (iso: string) => new Date(iso).getTime();

/** La sesión venció si `expiraEn` ya pasó o no es una fecha válida. */
export function sesionVencida(sesion: IResponseSesion, ahora: Date): boolean {
  const expira = instante(sesion.expiraEn);
  return Number.isNaN(expira) || expira <= ahora.getTime();
}

/** Toca renovar si el servidor dio `renovarDesde` y ya llegó ese momento. */
export function debeRenovar(sesion: IResponseSesion, ahora: Date): boolean {
  if (sesion.renovarDesde === null) {
    return false;
  }
  const desde = instante(sesion.renovarDesde);
  return !Number.isNaN(desde) && ahora.getTime() >= desde;
}

/** Copia de la sesión con solo los campos conocidos y la versión. Nunca lleva el PIN. */
function aGuardada(sesion: IResponseSesion): ISesionGuardada {
  return {
    version: 1,
    token: sesion.token,
    expiraEn: sesion.expiraEn,
    renovarDesde: sesion.renovarDesde,
    usuario: {
      id: sesion.usuario.id,
      nombre: sesion.usuario.nombre,
      usuario: sesion.usuario.usuario,
      rol: sesion.usuario.rol,
    },
  };
}

/** JSON que se guarda en el almacén seguro. */
export function serializarSesion(sesion: IResponseSesion): string {
  return JSON.stringify(aGuardada(sesion));
}

const esTexto = (valor: unknown): valor is string =>
  typeof valor === 'string' && valor.length > 0;

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null;

/** Lee el JSON guardado. Devuelve `null` si falta, no es JSON o no tiene la forma de la versión 1. */
export function leerSesionGuardada(
  texto: string | null,
): ISesionGuardada | null {
  if (!texto) {
    return null;
  }
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!esObjeto(datos) || !esObjeto(datos.usuario)) {
    return null;
  }
  const u = datos.usuario;
  const valida =
    datos.version === 1 &&
    esTexto(datos.token) &&
    esTexto(datos.expiraEn) &&
    (datos.renovarDesde === null || esTexto(datos.renovarDesde)) &&
    esTexto(u.id) &&
    typeof u.nombre === 'string' &&
    esTexto(u.usuario) &&
    ROLES.includes(u.rol as RolUsuario);
  return valida ? aGuardada(datos as unknown as IResponseSesion) : null;
}

/** URL de WhatsApp de la academia con el mensaje de ayuda del PIN. */
export function urlAyudaPin(): string {
  return `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(
    mensajesSesion.ayudaPinWhatsApp,
  )}`;
}
