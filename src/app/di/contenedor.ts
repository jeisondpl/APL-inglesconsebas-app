import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type { SesionActiva } from '@/modules/sesion/domain/models/SesionActiva';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import { crearBootSplashAdapter } from '@/native/adapters/BootSplashAdapter';
import { crearKeychainSecureStorageAdapter } from '@/native/adapters/KeychainSecureStorageAdapter';
import { crearLinkingEnlacesAdapter } from '@/native/adapters/LinkingEnlacesAdapter';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import type { SplashPort } from '@/native/ports/SplashPort';
import { crearClienteApi, type ClienteApi } from '@/shared/lib/api';
import { entorno } from '@/shared/lib/entorno';

import { etiquetaDispositivo } from './etiquetaDispositivo';

/** Repositorios de los módulos de negocio. Cada módulo añade aquí su puerto cuando se construye. */
export interface IRepositorios {
  sesion: SesionRepository;
}

/** Adaptadores de SDK nativos, expuestos por su puerto de src/native/ports. */
export interface INativos {
  splash: SplashPort;
  almacenSeguro: SecureStoragePort;
  enlaces: EnlacesPort;
}

export interface IDependencias {
  repositorios: IRepositorios;
  nativos: INativos;
  api: ClienteApi;
  /** Estado de la sesión en memoria, compartido por el cliente HTTP y React. */
  sesionActiva: SesionActiva;
}

/**
 * Único punto donde se instancian el cliente HTTP, los repositorios y los adaptadores
 * (docs/ARQUITECTURA.md § 5).
 */
export function crearDependencias(): IDependencias {
  const almacenSeguro = crearKeychainSecureStorageAdapter();
  const sesionActiva = crearSesionActiva();
  const api = crearClienteApi({
    urlBase: entorno.apiUrl,
    obtenerToken: () => Promise.resolve(null),
    alNoAutorizado: () => {},
  });
  return {
    repositorios: {
      sesion: crearApiSesionRepository(api, {
        etiquetaDispositivo: etiquetaDispositivo(),
      }),
    },
    nativos: {
      splash: crearBootSplashAdapter(),
      almacenSeguro,
      enlaces: crearLinkingEnlacesAdapter(),
    },
    api,
    sesionActiva,
  };
}
