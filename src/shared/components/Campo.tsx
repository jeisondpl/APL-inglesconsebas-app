import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

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
  });

/** Campo de texto con etiqueta asociada y error de validación (lámina: campo «Usuario»). */
export function Campo({
  etiqueta,
  valor,
  alCambiar,
  error,
  accessibilityHint,
  ...resto
}: IPropsCampo) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
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
      <TextInput
        placeholderTextColor={tema.colores.textoTenue}
        {...resto}
        accessibilityLabel={etiqueta}
        accessibilityHint={error ?? accessibilityHint}
        value={valor}
        onChangeText={alCambiar}
        style={[estilos.campo, error ? estilos.campoConError : null]}
      />
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
