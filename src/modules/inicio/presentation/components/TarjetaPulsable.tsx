import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Tarjeta } from '@/shared/components/Tarjeta';
import { usePresionEscala } from '@/shared/movimiento';

export interface IPropsTarjetaPulsable {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Tarjeta normal pulsable con la escala de presión de F1-04 (0.97 con resorte; con reduce-motion,
 * sin escala).
 */
export function TarjetaPulsable({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: IPropsTarjetaPulsable) {
  const { estiloEscala, alPresionar, alSoltar } = usePresionEscala();
  return (
    <Animated.View style={estiloEscala}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onPressIn={alPresionar}
        onPressOut={alSoltar}
      >
        <Tarjeta style={style}>{children}</Tarjeta>
      </Pressable>
    </Animated.View>
  );
}
