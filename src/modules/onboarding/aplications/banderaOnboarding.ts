import type { EstadoOnboarding } from '../domain/entities/Onboarding.entities';
import type { BanderaOnboarding } from '../domain/models/BanderaOnboarding';

/** Store de la bandera de la bienvenida en memoria, sin React. React lo lee con useSyncExternalStore. */
export function crearBanderaOnboarding(
  inicial: EstadoOnboarding = { tipo: 'cargando' },
): BanderaOnboarding {
  let estado = inicial;
  const oyentes = new Set<() => void>();
  return {
    obtener: () => estado,
    establecer(nuevo) {
      estado = nuevo;
      oyentes.forEach(oyente => oyente());
    },
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
