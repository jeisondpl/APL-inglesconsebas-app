import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  DESPLAZAMIENTO_ENTRADA,
  duraciones,
  resortes,
} from './movimiento.tokens';

export interface IPropsRevelar {
  children: ReactNode;
  /** Milisegundos antes de empezar la entrada (para escalonar bloques). Por defecto, 0. */
  retraso?: number;
  /** Desde dónde sube el bloque, en dp. Por defecto, 20. */
  desde?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Entrada animada: fundido y subida con resorte (como `Reveal` de Livic). Con reduce-motion solo
 * hay un fundido corto, sin desplazamiento.
 */
export function Revelar({
  children,
  retraso = 0,
  desde = DESPLAZAMIENTO_ENTRADA,
  style,
  testID,
}: IPropsRevelar) {
  const reducido = useReducedMotion();
  const opacidad = useSharedValue(0);
  const y = useSharedValue(reducido ? 0 : desde);

  useEffect(() => {
    if (reducido) {
      opacidad.value = withTiming(1, { duration: duraciones.fundidoCorto });
      return;
    }
    opacidad.value = withDelay(
      retraso,
      withTiming(1, { duration: duraciones.entrada }),
    );
    y.value = withDelay(retraso, withSpring(0, resortes.entrada));
  }, [reducido, retraso, opacidad, y]);

  const estiloAnimado = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View testID={testID} style={[style, estiloAnimado]}>
      {children}
    </Animated.View>
  );
}
