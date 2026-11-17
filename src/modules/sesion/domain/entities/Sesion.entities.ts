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
