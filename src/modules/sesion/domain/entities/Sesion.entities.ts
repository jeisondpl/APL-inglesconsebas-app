/** Roles de la app. Leap los llama student, teacher y admin; el adaptador los traduce. */
export type RolUsuario = 'estudiante' | 'profe' | 'admin';

export interface IArgsIniciarSesion {
  usuario: string;
  /** PIN de 4 dígitos. Solo viaja en la petición de login: nunca se guarda. */
  pin: string;
}

export interface IResponseUsuario {
  /** students.id, teachers.id o 'admin'. */
  id: string;
  /** Nombre visible ('Admin' para el admin). */
  nombre: string;
  /** Usuario con el que inicia sesión. */
  usuario: string;
  rol: RolUsuario;
}

export interface IResponseSesion {
  token: string;
  /** ISO UTC (expiresAt). */
  expiraEn: string;
  /** ISO UTC (renewAfter). `null` si el servidor no pide renovar. */
  renovarDesde: string | null;
  usuario: IResponseUsuario;
}

/**
 * El servidor pide el código enviado por correo antes de crear la sesión (doble factor, F1-06).
 * `desafio` es opaco y solo vive en memoria mientras se escribe el código.
 */
export interface IDesafioCodigo {
  requiereCodigo: true;
  desafio: string;
  /** Correo enmascarado (an***@gmail.com) para que la persona sepa dónde mirar. */
  correoEnmascarado: string;
  longitud: number;
  /** Segundos hasta poder pedir otro código. */
  reenviarEnSeg: number;
}

/** Respuesta del login con PIN: la sesión, o el desafío del código por correo. */
export type ResultadoLogin = IResponseSesion | IDesafioCodigo;

export interface IArgsVerificarCodigo {
  desafio: string;
  codigo: string;
}

/** Respuesta de reenviar el código. */
export interface IResponseReenvio {
  correoEnmascarado: string;
  reenviarEnSeg: number;
}

/** Lo que se guarda en el almacén seguro (JSON). Nunca el PIN. */
export interface ISesionGuardada extends IResponseSesion {
  version: 1;
}

/** Por qué no hay sesión: la cerró la persona o la invalidó el servidor (401). */
export type MotivoSinSesion = 'cerrada' | 'vencida';

export type EstadoSesion =
  | { tipo: 'restaurando' }
  | { tipo: 'sinSesion'; motivo?: MotivoSinSesion }
  | { tipo: 'autenticado'; sesion: IResponseSesion };

/** Datos de validar con `me`: usuario al día y nueva expiración. */
export interface IResponseUsuarioActual {
  usuario: IResponseUsuario;
  expiraEn: string;
}

/** Respuesta de renew. */
export interface IResponseRenovacion {
  token: string;
  expiraEn: string;
  renovarDesde: string | null;
}
