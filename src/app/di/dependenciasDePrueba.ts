import type { InicioRepository } from '@/modules/inicio/domain/models/InicioRepository';
import type { AgendaRepository } from '@/modules/agenda/domain/models/AgendaRepository';
import type { MensajesRepository } from '@/modules/mensajes/domain/models/MensajesRepository';
import { crearMemoriaMensajesRepository } from '@/modules/mensajes/infrastructure/memoriaMensajesRepository';
import { crearMemoriaAgendaRepository } from '@/modules/agenda/infrastructure/memoriaAgendaRepository';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import type { InicioProfeRepository } from '@/modules/inicio/domain/models/InicioProfeRepository';
import { crearMemoriaInicioProfeRepository } from '@/modules/inicio/infrastructure/memoriaInicioProfeRepository';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import type { EstadoOnboarding } from '@/modules/onboarding/domain/entities/Onboarding.entities';
import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type { EstadoSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearMemoriaSesionRepository } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import type { AudioPort } from '@/native/ports/AudioPort';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import type { SelectorImagenPort } from '@/native/ports/SelectorImagenPort';
import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';
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

/** Google sin configurar, como un build sin GOOGLE_WEB_CLIENT_ID: el botón no aparece. */
export const crearGoogleNoDisponible = (): GoogleSignInPort => ({
  disponible: false,
  obtenerIdToken: () => Promise.resolve({ tipo: 'cancelado' }),
  cerrarSesion: () => Promise.resolve(),
});

/** Audio sin micrófono: grabar devuelve «denegado» y reproducir falla con un mensaje. */
export const crearAudioNoDisponible = (): AudioPort => ({
  empezarGrabacion: () => Promise.resolve({ tipo: 'denegado' }),
  terminarGrabacion: () =>
    Promise.resolve({ tipo: 'error', msg: 'Sin audio.' }),
  cancelarGrabacion: () => Promise.resolve(),
  reproducir: () => Promise.resolve({ tipo: 'error', msg: 'Sin audio.' }),
  detener: () => Promise.resolve(),
});

export interface IOpcionesDependenciasDePrueba {
  /** Contenido inicial del almacén seguro (p. ej. `{ sesion: '<json>' }`). */
  almacenInicial?: Record<string, string>;
  /** Estado inicial de la sesión. Por defecto `restaurando`, como en la app. */
  estadoInicial?: EstadoSesion;
  repo?: SesionRepository;
  /** Repositorio del inicio. Por defecto, en memoria y vacío (estados vacíos, sin red). */
  inicio?: InicioRepository;
  /** Inicio del profe (F1-07). Por defecto, en memoria y vacío. */
  inicioProfe?: InicioProfeRepository;
  /** Clases del estudiante (F2-01). Por defecto, en memoria y vacío. */
  clases?: ClasesRepository;
  agenda?: AgendaRepository;
  /** Chat (F3-01). Por defecto, en memoria y vacío. */
  mensajes?: MensajesRepository;
  splash?: SplashPort;
  enlaces?: EnlacesPort;
  /** Selector de fotos (F3-01). Por defecto cancela. */
  imagenes?: SelectorImagenPort;
  /** Audio del chat (F3-01). Por defecto, sin permiso de micrófono. */
  audio?: AudioPort;
  /** Login con Google. Por defecto no disponible (el botón no aparece). */
  google?: GoogleSignInPort;
  almacen?: SecureStoragePort;
  /**
   * Estado inicial de la bandera de la bienvenida (EXT-01). Por defecto `visto`, para que los tests
   * que esperan el login con el almacén vacío sigan igual. Pasa `{ tipo: 'cargando' }` para ejercer
   * la lectura real de `hasSeenOnboarding` del almacén, como en la app.
   */
  onboardingInicial?: EstadoOnboarding;
}

/**
 * Contenedor para pruebas, sin red ni módulos nativos: repositorio de sesión en memoria (usuarios
 * del seed, Bearer de la sesión activa), almacén en memoria, splash y enlaces falsos y la bandera
 * de la bienvenida en `visto` salvo que se pida otra cosa.
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
      inicio: opciones.inicio ?? crearMemoriaInicioRepository(),
      inicioProfe: opciones.inicioProfe ?? crearMemoriaInicioProfeRepository(),
      clases: opciones.clases ?? crearMemoriaClasesRepository(),
      agenda: opciones.agenda ?? crearMemoriaAgendaRepository(),
      mensajes: opciones.mensajes ?? crearMemoriaMensajesRepository(),
    },
    nativos: {
      splash: opciones.splash ?? { ocultar: () => Promise.resolve() },
      almacenSeguro:
        opciones.almacen ?? crearAlmacenEnMemoria(opciones.almacenInicial),
      enlaces: opciones.enlaces ?? { abrir: () => Promise.resolve(true) },
      imagenes: opciones.imagenes ?? {
        elegir: () => Promise.resolve({ tipo: 'cancelado' }),
      },
      audio: opciones.audio ?? crearAudioNoDisponible(),
      google: opciones.google ?? crearGoogleNoDisponible(),
    },
    api,
    sesionActiva,
    banderaOnboarding: crearBanderaOnboarding(
      opciones.onboardingInicial ?? { tipo: 'visto' },
    ),
  };
}
