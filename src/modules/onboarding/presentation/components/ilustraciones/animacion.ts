import { useEffect } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * Reloj de las micro-animaciones de las ilustraciones (F1-04): avanza de 0 a 1 en `duracion` ms y
 * vuelve a empezar (o va y vuelve con `vaivén`). Con reduce-motion queda fijo en `reposo`, el
 * instante en que la ilustración se ve completa.
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
    t.value = withRepeat(
      withTiming(1, {
        duration: duracion,
        easing: vaiven ? Easing.inOut(Easing.sin) : Easing.linear,
      }),
      -1,
      vaiven,
    );
  }, [reducido, duracion, vaiven, reposo, t]);
  return t;
}
