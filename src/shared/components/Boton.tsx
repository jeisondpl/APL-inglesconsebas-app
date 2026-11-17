import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { usePresionEscala } from '@/shared/movimiento/usePresionEscala';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { Texto } from './Texto';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro';

export interface IPropsBoton {
  titulo: string;
  onPress: () => void;
  /** primario: relleno de marca; secundario: borde de marca; peligro: borde y texto rojos. */
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  /** Muestra un indicador de carga y no responde a pulsaciones. */
  cargando?: boolean;
  /** Por defecto, el título. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Alto mínimo del botón: por encima del toque mínimo de 44. */
export const ALTO_BOTON = 48;

const crearEstilos = (tema: ITema) => {
  const { colores } = tema;
  return StyleSheet.create({
    base: {
      minHeight: ALTO_BOTON,
      minWidth: tema.toqueMinimo,
      borderRadius: tema.radios.boton,
      paddingHorizontal: tema.espaciado.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primario: { backgroundColor: colores.marca },
    secundario: { borderWidth: 1.5, borderColor: colores.bordeMarca },
    peligro: { borderWidth: 1.5, borderColor: colores.bordePeligro },
    inactivo: { opacity: 0.5 },
    pulsado: { opacity: 0.8 },
    contenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  });
};

/** Pressable animado: recibe la escala al pulsar (F1-04) junto a sus estilos de siempre. */
const PressableAnimado = Animated.createAnimatedComponent(Pressable);

const colorTexto = {
  primario: 'sobreMarca',
  secundario: 'marca',
  peligro: 'peligro',
} as const;

/**
 * Botón del sistema de diseño: primario, secundario y peligro. Al pulsarlo escala a 0.97 con
 * resorte (F1-04; con reduce-motion solo baja la opacidad).
 */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  cargando = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: IPropsBoton) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const inactivo = deshabilitado || cargando;
  const [pulsado, setPulsado] = useState(false);
  const { estiloEscala, alPresionar, alSoltar } = usePresionEscala();
  return (
    <PressableAnimado
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={inactivo ? undefined : onPress}
      onPressIn={() => {
        setPulsado(true);
        alPresionar();
      }}
      onPressOut={() => {
        setPulsado(false);
        alSoltar();
      }}
      style={[
        estilos.base,
        estilos[variante],
        deshabilitado && estilos.inactivo,
        pulsado && estilos.pulsado,
        style,
        estiloEscala,
      ]}
    >
      <View style={estilos.contenido}>
        {cargando ? (
          <ActivityIndicator
            size="small"
            color={tema.colores[colorTexto[variante]]}
          />
        ) : null}
        <Texto variante="boton" color={colorTexto[variante]}>
          {titulo}
        </Texto>
      </View>
    </PressableAnimado>
  );
}
