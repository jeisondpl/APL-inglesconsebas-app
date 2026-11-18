import type { InicioRepository } from '@/modules/inicio/domain/models/InicioRepository';
import type { AgendaRepository } from '@/modules/agenda/domain/models/AgendaRepository';
import { crearApiAgendaRepository } from '@/modules/agenda/infrastructure/apiAgendaRepository';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { crearApiClasesRepository } from '@/modules/clases/infrastructure/apiClasesRepository';
import type { InicioProfeRepository } from '@/modules/inicio/domain/models/InicioProfeRepository';
import { crearApiInicioProfeRepository } from '@/modules/inicio/infrastructure/apiInicioProfeRepository';
import type { MensajesRepository } from '@/modules/mensajes/domain/models/MensajesRepository';
import { crearApiMensajesRepository } from '@/modules/mensajes/infrastructure/apiMensajesRepository';
import { crearApiInicioRepository } from '@/modules/inicio/infrastructure/apiInicioRepository';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import type { BanderaOnboarding } from '@/modules/onboarding/domain/models/BanderaOnboarding';
import { invalidarSesionUseCase } from '@/modules/sesion/aplications/invalidarSesion/invalidarSesion';
import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type { SesionActiva } from '@/modules/sesion/domain/models/SesionActiva';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import { crearBootSplashAdapter } from '@/native/adapters/BootSplashAdapter';
import { crearGoogleSignInAdapter } from '@/native/adapters/GoogleSignInAdapter';
import { crearGoogleSimuladoAdapter } from '@/native/adapters/GoogleSimuladoAdapter';
import { crearKeychainSecureStorageAdapter } from '@/native/adapters/KeychainSecureStorageAdapter';
import { crearLinkingEnlacesAdapter } from '@/native/adapters/LinkingEnlacesAdapter';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import type { SplashPort } from '@/native/ports/SplashPort';
import { crearClienteApi, type ClienteApi } from '@/shared/lib/api';
import { entorno } from '@/shared/lib/entorno';

import { etiquetaDispositivo } from './etiquetaDispositivo';

/** Repositorios de los módulos de negocio. Cada módulo añade aquí su puerto cuando se construye. */
export interface IRepositorios {
  sesion: SesionRepository;
  /** Inicio del estudiante (F1-05). */
  inicio: InicioRepository;
  /** Inicio del profe (F1-07). */
  inicioProfe: InicioProfeRepository;
  /** Clases del estudiante (F2-01). */
  clases: ClasesRepository;
  agenda: AgendaRepository;
  /** Chat estudiante–profe (F3-01). */
  mensajes: MensajesRepository;
}

/** Adaptadores de SDK nativos, expuestos por su puerto de src/native/ports. */
export interface INativos {
  splash: SplashPort;
  almacenSeguro: SecureStoragePort;
  enlaces: EnlacesPort;
  /** Login con Google (F1-06). */
  google: GoogleSignInPort;
}

export interface IDependencias {
  repositorios: IRepositorios;
  nativos: INativos;
  api: ClienteApi;
  /** Estado de la sesión en memoria, compartido por el cliente HTTP y React. */
  sesionActiva: SesionActiva;
  /** Bandera `hasSeenOnboarding` en memoria (EXT-01), compartida por el navegador y la bienvenida. */
  banderaOnboarding: BanderaOnboarding;
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
    // El token sale de la sesión activa; un 401 con sesión la limpia y vuelve al login (CA9).
    obtenerToken: () => Promise.resolve(sesionActiva.token()),
    alNoAutorizado: tokenPeticion => {
      invalidarSesionUseCase(almacenSeguro, sesionActiva, tokenPeticion);
    },
  });
  return {
    repositorios: {
      sesion: crearApiSesionRepository(api, {
        etiquetaDispositivo: etiquetaDispositivo(),
      }),
      inicio: crearApiInicioRepository(api),
      inicioProfe: crearApiInicioProfeRepository(api),
      clases: crearApiClasesRepository(api),
      agenda: crearApiAgendaRepository(api),
      mensajes: crearApiMensajesRepository(api),
    },
    nativos: {
      splash: crearBootSplashAdapter(),
      almacenSeguro,
      enlaces: crearLinkingEnlacesAdapter(),
      // Con client ID real, Google de verdad; sin él, el simulado si el build lo pide (F1-06).
      google:
        !entorno.googleWebClientId && entorno.googleSimuladoCorreo
          ? crearGoogleSimuladoAdapter(entorno.googleSimuladoCorreo)
          : crearGoogleSignInAdapter({
              webClientId: entorno.googleWebClientId,
              iosClientId: entorno.googleIosClientId,
            }),
    },
    api,
    sesionActiva,
    // Empieza en `cargando`: el navegador raíz la lee del almacén al arrancar.
    banderaOnboarding: crearBanderaOnboarding(),
  };
}
