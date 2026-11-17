import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duraciones } from '@/shared/movimiento/movimiento.tokens';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { Texto } from './Texto';

export interface IPropsCampo
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  /** Mensaje de validación junto al campo. Pone el borde en `peligro` y se anuncia como alerta. */
  error?: string;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    contenedor: { gap: tema.espaciado.xs + 2 },
    campo: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      borderRadius: tema.radios.campo,
      backgroundColor: tema.colores.campoFondo,
      paddingHorizontal: 14,
      paddingVertical: tema.espaciado.m,
      color: tema.colores.texto,
      fontFamily: tema.familias.dmSansRegular,
      fontSize: 14,
    },
    campoConError: { borderColor: tema.colores.peligro },
    caja: { position: 'relative' },
    // Anillo de foco: un borde de 2 px en `marca` encima del borde de 1 px, que aparece al enfocar.
    foco: {
      ...StyleSheet.absoluteFill,
      borderWidth: 2,
      borderColor: tema.colores.marca,
      borderRadius: tema.radios.campo,
    },
  });

/**
 * Campo de texto con etiqueta asociada y error de validación (lámina: campo «Usuario»). Al enfocarlo
 * el borde pasa a `marca` y de 1 a 2 px en 150 ms (F1-04, `TextField` de Livic); con error, el
 * borde se queda en `peligro`.
 */
export function Campo({
  etiqueta,
  valor,
  alCambiar,
  error,
  accessibilityHint,
  onFocus,
  onBlur,
  ...resto
}: IPropsCampo) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const foco = useSharedValue(0);
  const estiloFoco = useAnimatedStyle(() => ({ opacity: foco.value }));
  return (
    <View style={estilos.contenedor}>
      {/* La etiqueta visible repite el accessibilityLabel del campo: se oculta al lector. */}
      <Texto
        variante="cuerpoFuerte"
        color="textoSecundario"
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {etiqueta}
      </Texto>
      <View style={estilos.caja}>
        <TextInput
          placeholderTextColor={tema.colores.textoTenue}
          {...resto}
          accessibilityLabel={etiqueta}
          accessibilityHint={error ?? accessibilityHint}
          value={valor}
          onChangeText={alCambiar}
          onFocus={e => {
            foco.value = withTiming(1, { duration: duraciones.foco });
            onFocus?.(e);
          }}
          onBlur={e => {
            foco.value = withTiming(0, { duration: duraciones.foco });
            onBlur?.(e);
          }}
          style={[estilos.campo, error ? estilos.campoConError : null]}
        />
        {error ? null : (
          <Animated.View
            pointerEvents="none"
            style={[estilos.foco, estiloFoco]}
          />
        )}
      </View>
      {error ? (
        <Texto
          variante="detalle"
          color="peligro"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Texto>
      ) : null}
    </View>
  );
}
