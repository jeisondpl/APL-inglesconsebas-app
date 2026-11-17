import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IResponseSesion,
  IResponseUsuario,
} from '../domain/entities/Sesion.entities';
import type { SesionRepository } from '../domain/models/SesionRepository';
import { normalizarUsuario } from '../domain/validations/sesion.validations';

/** Usuario del repositorio en memoria: el del dominio más su PIN. */
export interface IUsuarioMemoria extends IResponseUsuario {
  pin: string;
}

/** Usuarios de prueba de ../docker/db/02-seed.sql (y el admin fijo de auth.php). */
export const USUARIOS_SEED: readonly IUsuarioMemoria[] = [
  {
    id: 'admin',
    nombre: 'Admin',
    usuario: 'yggodguz',
    rol: 'admin',
    pin: '2905',
  },
  {
    id: 't025ce0c8974fad25',
    nombre: 'Meli',
    usuario: 'meli',
    rol: 'profe',
    pin: '1111',
  },
  {
    id: 'tcaro00000000001',
    nombre: 'Caro',
    usuario: 'caro',
    rol: 'profe',
    pin: '2222',
  },
  {
    id: 's0000000000000a1',
    nombre: 'Ana Torres',
    usuario: 'ana',
    rol: 'estudiante',
    pin: '1234',
  },
  {
    id: 's0000000000000b2',
    nombre: 'Luis Pérez',
    usuario: 'luis',
    rol: 'estudiante',
    pin: '1234',
  },
  {
    id: 's0000000000000c3',
    nombre: 'Sofía Ramírez',
    usuario: 'sofia',
    rol: 'estudiante',
    pin: '1234',
  },
];

export interface IOpcionesMemoriaSesion {
  usuarios?: readonly IUsuarioMemoria[];
  /** Token con el que llegan `me`, `renew` y `logout` (el Bearer). Por defecto, el último emitido. */
  obtenerToken?: () => string | null;
  /** Reloj inyectable. */
  ahora?: () => Date;
}

const DIA_MS = 24 * 60 * 60 * 1000;
/** Mismos plazos que la sesión de la App en Leap: 30 días de inactividad y renovar a las 24 h. */
const VIDA_MS = 30 * DIA_MS;
const RENOVAR_MS = DIA_MS;

const NO_AUTORIZADO = textosComunes.errores.noAutorizado;
const CREDENCIALES = 'Usuario o PIN incorrecto';

/** Token conocido de antemano para cada usuario: `memoria-<usuario>`. Sirve para sesiones guardadas. */
export const tokenMemoria = (usuario: string) => `memoria-${usuario}`;

/**
 * Implementación en memoria de SesionRepository para los tests de flujo y de pantalla. Responde
 * como auth.php: 401 con credenciales malas o token desconocido, `renew` cambia el token y
 * `logout` lo revoca (idempotente).
 */
export function crearMemoriaSesionRepository(
  opciones: IOpcionesMemoriaSesion = {},
): SesionRepository {
  const { usuarios = USUARIOS_SEED, ahora = () => new Date() } = opciones;
  const tokens = new Map<string, IResponseUsuario>();
  let ultimo: string | null = null;
  let emitidos = 0;

  const sinPin = ({ pin: _pin, ...usuario }: IUsuarioMemoria) => usuario;
  for (const u of usuarios) {
    tokens.set(tokenMemoria(u.usuario), sinPin(u));
  }

  const actual = () => (opciones.obtenerToken ?? (() => ultimo))();
  const usuarioActual = () => {
    const token = actual();
    return token ? tokens.get(token) : undefined;
  };
  const fechas = () => {
    const t = ahora().getTime();
    return {
      expiraEn: new Date(t + VIDA_MS).toISOString(),
      renovarDesde: new Date(t + RENOVAR_MS).toISOString(),
    };
  };
  const emitir = (usuario: IResponseUsuario) => {
    emitidos += 1;
    const token = `${tokenMemoria(usuario.usuario)}-${emitidos}`;
    tokens.set(token, usuario);
    ultimo = token;
    return token;
  };
  const noAutorizado = <T>(): HttpResponse<T> =>
    respuestaError<T>(NO_AUTORIZADO, 401);

  return {
    async iniciarSesion(args) {
      const nombre = normalizarUsuario(args.usuario);
      const encontrado = usuarios.find(
        u => u.usuario === nombre && u.pin === args.pin,
      );
      if (!encontrado) {
        return respuestaError(CREDENCIALES, 401);
      }
      const usuario = sinPin(encontrado);
      const sesion: IResponseSesion = {
        token: emitir(usuario),
        ...fechas(),
        usuario,
      };
      return respuestaOk(sesion, 200);
    },

    async obtenerUsuarioActual() {
      const usuario = usuarioActual();
      return usuario
        ? respuestaOk({ usuario, expiraEn: fechas().expiraEn }, 200)
        : noAutorizado();
    },

    async renovar() {
      const token = actual();
      const usuario = usuarioActual();
      if (!token || !usuario) {
        return noAutorizado();
      }
      tokens.delete(token);
      return respuestaOk({ token: emitir(usuario), ...fechas() }, 200);
    },

    async cerrarSesion() {
      const token = actual();
      if (token) {
        tokens.delete(token);
      }
      return respuestaOk<void>(undefined, 200);
    },
  };
}
