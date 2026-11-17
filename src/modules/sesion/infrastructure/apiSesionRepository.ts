import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IResponseUsuario,
  RolUsuario,
} from '../domain/entities/Sesion.entities';
import type { SesionRepository } from '../domain/models/SesionRepository';
import { mensajesSesion } from '../domain/sesion.mensajes';
import { normalizarUsuario } from '../domain/validations/sesion.validations';
import type {
  ILeapLogin,
  ILeapMe,
  ILeapPersona,
  ILeapRenovacion,
  RolLeap,
} from './leap.tipos';

const RUTA = 'auth.php';

const ROLES: Record<RolLeap, RolUsuario> = {
  student: 'estudiante',
  teacher: 'profe',
  admin: 'admin',
};

export interface IOpcionesApiSesion {
  /** Etiqueta del dispositivo para auth_sessions (máx. 100 caracteres). */
  etiquetaDispositivo: string;
}

/** Rol de la App a partir del de Leap, o `null` si no se reconoce. */
function rolDe(role: unknown): RolUsuario | null {
  return typeof role === 'string' && role in ROLES
    ? ROLES[role as RolLeap]
    : null;
}

/** Persona de Leap con la forma del dominio. */
function usuarioDe(
  persona: ILeapPersona,
  rol: RolUsuario,
  usuarioPorDefecto: string,
): IResponseUsuario {
  return {
    id: String(persona.id),
    nombre: persona.name,
    usuario: persona.username || usuarioPorDefecto,
    rol,
  };
}

/**
 * Persona según el rol. El admin del login no trae datos: se usa `{id:'admin', nombre:'Admin'}`
 * con el usuario enviado. Devuelve `null` si falta la persona que exige el rol.
 */
function personaDe(
  datos: ILeapLogin | ILeapMe,
  rol: RolUsuario,
  usuario: string,
): IResponseUsuario | null {
  if (rol === 'admin') {
    const admin = 'admin' in datos ? datos.admin : undefined;
    return usuarioDe(admin ?? { id: 'admin', name: 'Admin' }, rol, usuario);
  }
  const persona = rol === 'profe' ? datos.teacher : datos.student;
  return persona ? usuarioDe(persona, rol, usuario) : null;
}

/** Errores HTTP (y de red) tal cual los dio el cliente, con su `msg` y `code`. */
function propagar<T>(r: HttpResponse<unknown>): HttpResponse<T> {
  return respuestaError<T>(r.msg ?? '', r.code);
}

/**
 * Adaptador de SesionRepository con auth.php de Leap. Traduce roles y nombres de campos y trata
 * como error legible la respuesta sin token (auth.php sin F1-02) o con un rol desconocido.
 */
export function crearApiSesionRepository(
  api: ClienteApi,
  opciones: IOpcionesApiSesion,
): SesionRepository {
  return {
    async iniciarSesion(args) {
      const usuario = normalizarUsuario(args.usuario);
      const r = await api.post<ILeapLogin>(RUTA, {
        username: usuario,
        pin: args.pin,
        client: 'app',
        deviceLabel: opciones.etiquetaDispositivo,
      });
      if (r.error) {
        return propagar(r);
      }
      const datos = r.response;
      if (!datos?.token || !datos.expiresAt) {
        return respuestaError(mensajesSesion.sinToken, r.code);
      }
      const rol = rolDe(datos.role);
      const persona = rol ? personaDe(datos, rol, usuario) : null;
      if (!persona) {
        return respuestaError(mensajesSesion.rolDesconocido, r.code);
      }
      return respuestaOk(
        {
          token: datos.token,
          expiraEn: datos.expiresAt,
          renovarDesde: datos.renewAfter ?? null,
          usuario: persona,
        },
        r.code,
      );
    },

    async obtenerUsuarioActual() {
      const r = await api.get<ILeapMe>(RUTA, { action: 'me' });
      if (r.error) {
        return propagar(r);
      }
      const datos = r.response;
      const rol = rolDe(datos?.role);
      if (!datos || !rol) {
        return respuestaError(mensajesSesion.rolDesconocido, r.code);
      }
      const persona = personaDe(datos, rol, '');
      if (!persona || !datos.expiresAt) {
        return respuestaError(textosComunes.errores.respuestaInvalida, r.code);
      }
      return respuestaOk(
        { usuario: persona, expiraEn: datos.expiresAt },
        r.code,
      );
    },

    async renovar() {
      const r = await api.post<ILeapRenovacion>(RUTA, undefined, {
        action: 'renew',
      });
      if (r.error) {
        return propagar(r);
      }
      const datos = r.response;
      if (!datos?.token || !datos.expiresAt) {
        return respuestaError(mensajesSesion.sinToken, r.code);
      }
      return respuestaOk(
        {
          token: datos.token,
          expiraEn: datos.expiresAt,
          renovarDesde: datos.renewAfter ?? null,
        },
        r.code,
      );
    },

    async cerrarSesion() {
      const r = await api.post<unknown>(RUTA, {}, { action: 'logout' });
      return r.error ? propagar<void>(r) : respuestaOk<void>(undefined, r.code);
    },
  };
}
