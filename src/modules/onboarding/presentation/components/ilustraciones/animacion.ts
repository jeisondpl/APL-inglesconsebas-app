import { useEffect } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  duraciones,
  REPETICIONES_DECORATIVAS,
} from '@/shared/movimiento/movimiento.tokens';

/**
 * Reloj de las micro-animaciones de las ilustraciones (F1-04): avanza de 0 a 1 en `duracion` ms y
 * vuelve a empezar (o va y vuelve con `vaivén`) unas veces y se queda en `reposo`, el instante en
 * que la ilustración se ve completa (un bucle infinito impide leer la pantalla por accesibilidad).
 * Con reduce-motion queda fijo en `reposo` desde el principio.
 */
export function useBucleIlustracion(
  duracion: number,
  { vaiven = false, reposo = 1 }: { vaiven?: boolean; reposo?: number } = {},
): SharedValue<number> {
  const reducido = useReducedMotion();
  const t = useSharedValue(reducido ? reposo : 0);
  useEffect(() => {
    if (reducido) {
      t.value = reposo;
      return;
    }
    t.value = withSequence(
      withRepeat(
        withTiming(1, {
          duration: duracion,
          easing: vaiven ? Easing.inOut(Easing.sin) : Easing.linear,
        }),
        REPETICIONES_DECORATIVAS,
        vaiven,
      ),
      withTiming(reposo, { duration: duraciones.fundidoCorto }),
    );
  }, [reducido, duracion, vaiven, reposo, t]);
  return t;
}
