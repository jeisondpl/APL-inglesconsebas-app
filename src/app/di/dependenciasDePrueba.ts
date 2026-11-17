import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type { EstadoSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearMemoriaSesionRepository } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import type { SplashPort } from '@/native/ports/SplashPort';
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError } from '@/shared/lib/HttpResponse';

import type { IDependencias } from './contenedor';

/** Almacén seguro en memoria. `datos` queda expuesto para inspeccionarlo. */
export interface IAlmacenEnMemoria extends SecureStoragePort {
  datos: Map<string, string>;
}

export function crearAlmacenEnMemoria(
  inicial: Record<string, string> = {},
): IAlmacenEnMemoria {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    leer: async clave => datos.get(clave) ?? null,
    guardar: async (clave, valor) => {
      datos.set(clave, valor);
      return true;
    },
    borrar: async clave => {
      datos.delete(clave);
    },
  };
}

export interface IOpcionesDependenciasDePrueba {
  /** Contenido inicial del almacén seguro (p. ej. `{ sesion: '<json>' }`). */
  almacenInicial?: Record<string, string>;
  /** Estado inicial de la sesión. Por defecto `restaurando`, como en la app. */
  estadoInicial?: EstadoSesion;
  repo?: SesionRepository;
  splash?: SplashPort;
  enlaces?: EnlacesPort;
  almacen?: SecureStoragePort;
}

/**
 * Contenedor para pruebas, sin red ni módulos nativos: repositorio de sesión en memoria (usuarios
 * del seed, Bearer de la sesión activa), almacén en memoria y splash y enlaces falsos.
 */
export function crearDependenciasDePrueba(
  opciones: IOpcionesDependenciasDePrueba = {},
): IDependencias {
  const sesionActiva = crearSesionActiva(opciones.estadoInicial);
  const sinRed = () => Promise.resolve(respuestaError<never>('sin red', 0));
  const api: ClienteApi = { get: sinRed, post: sinRed };
  return {
    repositorios: {
      sesion:
        opciones.repo ??
        crearMemoriaSesionRepository({
          obtenerToken: () => sesionActiva.token(),
        }),
    },
    nativos: {
      splash: opciones.splash ?? { ocultar: () => Promise.resolve() },
      almacenSeguro:
        opciones.almacen ?? crearAlmacenEnMemoria(opciones.almacenInicial),
      enlaces: opciones.enlaces ?? { abrir: () => Promise.resolve(true) },
    },
    api,
    sesionActiva,
  };
}
