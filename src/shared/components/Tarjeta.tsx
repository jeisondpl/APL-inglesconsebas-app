import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useEstilos, type ITema } from '@/shared/theme';

export interface IPropsTarjeta {
  children: ReactNode;
  /** normal: superficie con borde (radio 20); destacada: héroe «Próxima clase» (radio 26). */
  variante?: 'normal' | 'destacada';
  /** Si se pasa, la tarjeta es pulsable y se anuncia como botón. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    normal: {
      backgroundColor: tema.colores.superficie,
      borderColor: tema.colores.borde,
      borderWidth: 1,
      borderRadius: tema.radios.tarjeta,
      padding: 14,
      gap: tema.espaciado.s,
    },
    destacada: {
      backgroundColor: tema.colores.destacado,
      borderColor: tema.colores.bordeDestacado,
      borderWidth: 1,
      borderRadius: tema.radios.heroe,
      padding: 18,
      gap: tema.espaciado.s,
    },
    pulsada: { opacity: 0.85 },
  });

/** Tarjeta del sistema de diseño (lámina: tarjetas de A-M2). */
export function Tarjeta({
  children,
  variante = 'normal',
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: IPropsTarjeta) {
  const estilos = useEstilos(crearEstilos);
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={({ pressed }) => [
          estilos[variante],
          pressed && estilos.pulsada,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[estilos[variante], style]}
    >
      {children}
    </View>
  );
}
