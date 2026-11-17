import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { useBanderaOnboarding, useNative } from '@/app/di';

import type { EstadoOnboarding } from '../../domain/entities/Onboarding.entities';
import {
  paginaAnterior,
  paginaDesdeDesplazamiento,
  paginaSiguiente,
  TOTAL_PAGINAS_ONBOARDING,
} from '../../domain/validations/onboarding.validations';
import { arrancarOnboardingUseCase } from '../arrancarOnboarding/arrancarOnboarding';
import { marcarOnboardingVistoUseCase } from '../marcarOnboardingVisto/marcarOnboardingVisto';

/** Estado de la bandera de la bienvenida, suscrito a sus cambios. */
function useEstadoOnboarding(): EstadoOnboarding {
  const bandera = useBanderaOnboarding();
  return useSyncExternalStore(bandera.suscribir, bandera.obtener);
}

/**
 * Lee la bandera al arrancar, una vez, y devuelve su estado. Mientras sea `cargando` el navegador
 * no pinta nada y el splash sigue. Con sesión y la bandera pendiente, la marca (CA4): así cerrar
 * sesión lleva al login y no a la bienvenida. `haySesion` es un booleano para no depender del
 * módulo de sesión.
 */
export function useArranqueOnboarding(haySesion: boolean): EstadoOnboarding {
  const bandera = useBanderaOnboarding();
  const almacen = useNative('almacenSeguro');
  const estado = useEstadoOnboarding();
  const arrancado = useRef(false);

  useEffect(() => {
    if (arrancado.current || bandera.obtener().tipo !== 'cargando') {
      return;
    }
    arrancado.current = true;
    arrancarOnboardingUseCase({ almacen, bandera });
  }, [almacen, bandera]);

  useEffect(() => {
    if (haySesion && estado.tipo === 'pendiente') {
      marcarOnboardingVistoUseCase(almacen, bandera);
    }
  }, [haySesion, estado.tipo, almacen, bandera]);

  return estado;
}

export interface IOnboardingController {
  indice: number;
  total: number;
  esUltima: boolean;
  /** Avanza o, en la última página, termina. */
  _siguiente(): void;
  /** Página anterior; `false` en la primera (atrás de Android no se intercepta). */
  _anterior(): boolean;
  /** Sincroniza el índice tras deslizar. */
  _alDesplazar(x: number, ancho: number): void;
  /** Omitir o Comenzar: marca visto una sola vez (CA9). */
  _terminar(): void;
}

/**
 * Páginas de la bienvenida y su cierre. Terminar pone la bandera en `visto`: el navegador raíz
 * quita el grupo de la bienvenida y deja el login como única ruta.
 */
export function useOnboardingController(): IOnboardingController {
  const bandera = useBanderaOnboarding();
  const almacen = useNative('almacenSeguro');
  const [indice, setIndice] = useState(0);
  const terminado = useRef(false);
  const total = TOTAL_PAGINAS_ONBOARDING;

  const _terminar = useCallback(() => {
    if (terminado.current) {
      return;
    }
    terminado.current = true;
    // Si guardar falla se avanza igual (P8): la bandera queda `visto` en memoria.
    marcarOnboardingVistoUseCase(almacen, bandera);
  }, [almacen, bandera]);

  const _siguiente = useCallback(() => {
    const siguiente = paginaSiguiente(indice, total);
    if (siguiente === null) {
      _terminar();
    } else {
      setIndice(siguiente);
    }
  }, [indice, total, _terminar]);

  const _anterior = useCallback(() => {
    const anterior = paginaAnterior(indice);
    if (anterior === null) {
      return false;
    }
    setIndice(anterior);
    return true;
  }, [indice]);

  const _alDesplazar = useCallback(
    (x: number, ancho: number) => {
      setIndice(paginaDesdeDesplazamiento(x, ancho, total));
    },
    [total],
  );

  return {
    indice,
    total,
    esUltima: indice === total - 1,
    _siguiente,
    _anterior,
    _alDesplazar,
    _terminar,
  };
}
