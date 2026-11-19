import { useCallback } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { duraciones, GOLPES_SACUDIDA } from './movimiento.tokens';

export interface ISacudida {
  /** Estilo animado con el desplazamiento horizontal. */
  estiloSacudida: ReturnType<typeof useAnimatedStyle>;
  /** Lanza la sacudida (-8, 8, -6, 6, 0). Con reduce-motion no hace nada. */
  sacudir: () => void;
  /** `true` si la sacudida se omite por reduce-motion. */
  reducido: boolean;
}

/** Sacudida horizontal de error, como la tarjeta del login de Livic. */
export function useSacudida(): ISacudida {
  const reducido = useReducedMotion();
  const x = useSharedValue(0);

  const sacudir = useCallback(() => {
    if (reducido) {
      return;
    }
    const golpes = GOLPES_SACUDIDA.map((destino, i) =>
      withTiming(destino, {
        duration: duraciones.golpeSacudida,
        easing:
          i === GOLPES_SACUDIDA.length - 1
            ? Easing.out(Easing.quad)
            : undefined,
      }),
    );
    x.value = withSequence(...golpes);
  }, [reducido, x]);

  const estiloSacudida = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return { estiloSacudida, sacudir, reducido };
}
