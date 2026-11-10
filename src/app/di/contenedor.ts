import { crearClienteApi, type ClienteApi } from '@/shared/lib/api';
import { entorno } from '@/shared/lib/entorno';

/**
 * Repositorios de los módulos de negocio. Cada módulo añade aquí su puerto cuando se construye
 * (p. ej. `clases: ClasesRepository`). Vacío hasta la primera feature con módulo.
 */
export interface IRepositorios {}

/**
 * Adaptadores de SDK nativos, expuestos por su puerto de src/native/ports. Vacío hasta el primer
 * SDK (el splash se aplazó a la feature de sistema de diseño).
 */
export interface INativos {}

export interface IDependencias {
  repositorios: IRepositorios;
  nativos: INativos;
  api: ClienteApi;
}

/**
 * Único punto donde se instancian el cliente HTTP, los repositorios y los adaptadores
 * (docs/ARQUITECTURA.md § 5). La feature de sesión sustituirá `obtenerToken` y `alNoAutorizado`.
 */
export function crearDependencias(): IDependencias {
  const api = crearClienteApi({
    urlBase: entorno.apiUrl,
    obtenerToken: () => Promise.resolve(null),
    alNoAutorizado: () => {},
  });
  return { repositorios: {}, nativos: {}, api };
}
