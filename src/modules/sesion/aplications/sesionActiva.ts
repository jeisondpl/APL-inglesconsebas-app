import type { EstadoSesion } from '../domain/entities/Sesion.entities';
import type { SesionActiva } from '../domain/models/SesionActiva';

/** Store de la sesión en memoria, sin React. React lo lee con useSyncExternalStore. */
export function crearSesionActiva(
  inicial: EstadoSesion = { tipo: 'restaurando' },
): SesionActiva {
  let estado = inicial;
  let cerrando = false;
  const oyentes = new Set<() => void>();
  return {
    obtener: () => estado,
    token: () => (estado.tipo === 'autenticado' ? estado.sesion.token : null),
    establecer(nuevo) {
      estado = nuevo;
      cerrando = false;
      oyentes.forEach(oyente => oyente());
    },
    iniciarCierre() {
      cerrando = estado.tipo === 'autenticado';
    },
    esVigente: token =>
      !cerrando &&
      estado.tipo === 'autenticado' &&
      estado.sesion.token === token,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
