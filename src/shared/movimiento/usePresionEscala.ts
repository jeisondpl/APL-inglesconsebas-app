import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ESCALA_PRESION, resortes } from './movimiento.tokens';

export interface IPresionEscala {
  /** Estilo animado con la escala; va en un `Animated.View` o en un componente animado. */
  estiloEscala: ReturnType<typeof useAnimatedStyle>;
  /** Para `onPressIn`. */
  alPresionar: () => void;
  /** Para `onPressOut`. */
  alSoltar: () => void;
}

/**
 * Escala a `escala` (0.97 por defecto) con resorte mientras se mantiene pulsado y vuelve a 1 al
 * soltar. Con reduce-motion no escala: el control conserva su respuesta de opacidad.
 */
export function usePresionEscala(escala = ESCALA_PRESION): IPresionEscala {
  const reducido = useReducedMotion();
  const valor = useSharedValue(1);

  const alPresionar = useCallback(() => {
    if (!reducido) {
      valor.value = withSpring(escala, resortes.presion);
    }
  }, [reducido, escala, valor]);

  const alSoltar = useCallback(() => {
    if (!reducido) {
      valor.value = withSpring(1, resortes.presion);
    }
  }, [reducido, valor]);

  const estiloEscala = useAnimatedStyle(() => ({
    transform: [{ scale: valor.value }],
  }));

  return { estiloEscala, alPresionar, alSoltar };
}
