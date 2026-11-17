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
  /**
   * Correo registrado (F1-06). Con correo, el login con PIN pide el código `CODIGO_MEMORIA` y
   * Google entra con el ID token `tokenGoogleMemoria(usuario)`. El seed no lo trae: los tests de
   * F1-03 siguen entrando solo con el PIN.
   */
  correo?: string;
}

/** Código por correo que acepta el repositorio en memoria. */
export const CODIGO_MEMORIA = '123456';

/** ID token de Google que el repositorio en memoria reconoce para ese usuario (si tiene correo). */
export const tokenGoogleMemoria = (usuario: string) => `google-${usuario}`;

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
const CODIGO_MAL = 'Código incorrecto.';
const DESAFIO_VENCIDO = 'El código venció. Vuelve a iniciar sesión.';
const GOOGLE_SIN_CUENTA = 'Tu correo no está registrado en la academia.';

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

  // Solo los datos del dominio: nunca el PIN ni el correo.
  const sinPin = ({ id, nombre, usuario, rol }: IUsuarioMemoria) => ({
    id,
    nombre,
    usuario,
    rol,
  });
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
  const sesionPara = (usuario: IResponseUsuario): IResponseSesion => ({
    token: emitir(usuario),
    ...fechas(),
    usuario,
  });
  /** Desafíos pendientes de código: desafío → usuario. */
  const desafios = new Map<string, IResponseUsuario>();

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
      const { correo } = encontrado;
      if (correo) {
        const desafio = `desafio-${usuario.usuario}-${desafios.size + 1}`;
        desafios.set(desafio, usuario);
        return respuestaOk(
          {
            requiereCodigo: true as const,
            desafio,
            correoEnmascarado: `${correo.slice(0, 2)}***@${
              correo.split('@')[1]
            }`,
            longitud: CODIGO_MEMORIA.length,
            reenviarEnSeg: 60,
          },
          200,
        );
      }
      return respuestaOk(sesionPara(usuario), 200);
    },

    async verificarCodigo({ desafio, codigo }) {
      const usuario = desafios.get(desafio);
      if (!usuario) {
        return respuestaError(DESAFIO_VENCIDO, 410);
      }
      if (codigo !== CODIGO_MEMORIA) {
        return respuestaError(CODIGO_MAL, 401);
      }
      desafios.delete(desafio);
      return respuestaOk(sesionPara(usuario), 200);
    },

    async reenviarCodigo(desafio) {
      return desafios.has(desafio)
        ? respuestaOk({ correoEnmascarado: '', reenviarEnSeg: 60 }, 200)
        : respuestaError(DESAFIO_VENCIDO, 410);
    },

    async iniciarConGoogle(idToken) {
      const encontrado = usuarios.find(
        u => u.correo && tokenGoogleMemoria(u.usuario) === idToken,
      );
      if (!encontrado) {
        return respuestaError(GOOGLE_SIN_CUENTA, 404);
      }
      const usuario = sinPin(encontrado);
      return respuestaOk(sesionPara(usuario), 200);
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
