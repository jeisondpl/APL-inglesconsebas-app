import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Barra de pestañas que se oculta con el scroll (F1-05, `useScrollTabBarVisibility` de Livic).
 * Livic usa mutables de módulo; aquí el estado vive en un proveedor (lo monta la estructura de
 * pestañas de `src/app`), así cada sesión empieza con la barra visible y las pantallas de los
 * módulos solo dependen de `shared`.
 */

/** Espacio que reserva el contenido bajo el scroll para no quedar tapado por la barra. */
export const ESPACIO_BARRA_PESTANAS = 122;

/** Píxeles de scroll antes de considerar que cambió la dirección. */
export const UMBRAL_DIRECCION = 10;

/** 1 = bajando (ocultar) · -1 = subiendo (mostrar) · 0 = sin cambio. */
export type DireccionDesplazamiento = -1 | 0 | 1;

export interface IEstadoBarraPestanas {
  /** Última dirección de scroll de la pantalla activa. */
  direccion: SharedValue<number>;
  /** Vuelve a mostrar la barra (al cambiar de pestaña). */
  mostrar(): void;
}

const ContextoBarra = createContext<IEstadoBarraPestanas | null>(null);

export function ProveedorBarraPestanas({ children }: { children: ReactNode }) {
  const direccion = useSharedValue(0);
  const valor = useMemo<IEstadoBarraPestanas>(
    () => ({
      direccion,
      mostrar: () => {
        direccion.value = -1;
      },
    }),
    [direccion],
  );
  return (
    <ContextoBarra.Provider value={valor}>{children}</ContextoBarra.Provider>
  );
}

/** Estado de la barra, o `null` fuera de la estructura de pestañas. */
export function useEstadoBarraPestanas(): IEstadoBarraPestanas | null {
  return useContext(ContextoBarra);
}

/**
 * Dirección del scroll entre dos posiciones. Arriba del todo (rebote incluido) siempre muestra.
 */
export function direccionDesplazamiento(
  y: number,
  anterior: number,
  umbral = UMBRAL_DIRECCION,
): DireccionDesplazamiento {
  'worklet';
  if (y <= 0) {
    return -1;
  }
  if (y > anterior + umbral) {
    return 1;
  }
  if (y < anterior - umbral) {
    return -1;
  }
  return 0;
}

/**
 * Manejador de `onScroll` para un `Animated.ScrollView`: al bajar oculta la barra y al subir la
 * muestra. Fuera de la estructura de pestañas no hace nada.
 */
export function useOcultarBarraAlDesplazar() {
  const estado = useContext(ContextoBarra);
  const anterior = useSharedValue(0);
  const direccion = estado?.direccion;
  return useAnimatedScrollHandler({
    onScroll: evento => {
      const y = evento.contentOffset.y;
      const nueva = direccionDesplazamiento(y, anterior.value);
      if (direccion && nueva !== 0) {
        direccion.value = nueva;
      }
      if (nueva !== 0) {
        anterior.value = y;
      }
    },
  });
}
