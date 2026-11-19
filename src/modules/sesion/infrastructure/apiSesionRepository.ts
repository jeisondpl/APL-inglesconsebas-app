import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IResponseSesion,
  IResponseUsuario,
  RolUsuario,
} from '../domain/entities/Sesion.entities';
import type { SesionRepository } from '../domain/models/SesionRepository';
import { mensajesSesion } from '../domain/sesion.mensajes';
import {
  LONGITUD_CODIGO,
  normalizarUsuario,
} from '../domain/validations/sesion.validations';
import type {
  ILeapDesafio,
  ILeapLogin,
  ILeapMe,
  ILeapPersona,
  ILeapRenovacion,
  ILeapReenvio,
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

/** Segundos por defecto entre reenvíos si el servidor no los indica (igual que Leap). */
const REENVIO_POR_DEFECTO = 60;

const esDesafioLeap = (datos: unknown): datos is ILeapDesafio =>
  typeof datos === 'object' &&
  datos !== null &&
  (datos as ILeapDesafio).requiresCode === true;

/**
 * Sesión a partir del cuerpo de login de Leap (PIN, código o Google). Error legible si falta el
 * token (auth.php sin F1-02) o el rol no se reconoce.
 */
function sesionDe(
  r: HttpResponse<ILeapLogin>,
  usuario: string,
): HttpResponse<IResponseSesion> {
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
      const r = await api.post<ILeapLogin | ILeapDesafio>(RUTA, {
        username: usuario,
        pin: args.pin,
        client: 'app',
        deviceLabel: opciones.etiquetaDispositivo,
      });
      if (!r.error && esDesafioLeap(r.response)) {
        const d = r.response;
        if (!d.challenge) {
          return respuestaError(mensajesSesion.desafioInvalido, r.code);
        }
        return respuestaOk(
          {
            requiereCodigo: true as const,
            desafio: d.challenge,
            correoEnmascarado: d.emailMasked ?? '',
            longitud: d.codeLength ?? LONGITUD_CODIGO,
            reenviarEnSeg: d.resendAfter ?? REENVIO_POR_DEFECTO,
          },
          r.code,
        );
      }
      return sesionDe(r as HttpResponse<ILeapLogin>, usuario);
    },

    async verificarCodigo(args) {
      const r = await api.post<ILeapLogin>(
        RUTA,
        { challenge: args.desafio, code: args.codigo },
        { action: 'verify_code' },
      );
      return sesionDe(r, '');
    },

    async reenviarCodigo(desafio) {
      const r = await api.post<ILeapReenvio>(
        RUTA,
        { challenge: desafio },
        { action: 'resend_code' },
      );
      if (r.error) {
        return propagar(r);
      }
      return respuestaOk(
        {
          correoEnmascarado: r.response?.emailMasked ?? '',
          reenviarEnSeg: r.response?.resendAfter ?? REENVIO_POR_DEFECTO,
        },
        r.code,
      );
    },

    async iniciarConGoogle(idToken) {
      const r = await api.post<ILeapLogin>(
        RUTA,
        { idToken, client: 'app', deviceLabel: opciones.etiquetaDispositivo },
        { action: 'google' },
      );
      return sesionDe(r, '');
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
