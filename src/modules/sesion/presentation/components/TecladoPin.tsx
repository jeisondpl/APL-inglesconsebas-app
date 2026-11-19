import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '@/shared/components';
import { usePresionEscala } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';

export interface IPropsTecladoPin {
  alPulsarDigito: (digito: string) => void;
  alBorrar: () => void;
  alConfirmar: () => void;
  /** Confirmar solo responde con el PIN completo. */
  confirmarActivo: boolean;
  /** Mientras se envía, ninguna tecla responde. */
  deshabilitado: boolean;
}

/** Alto mínimo de cada tecla (CA15: ≥ 64 dp). */
export const ALTO_TECLA = 64;

const FILAS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    teclado: { gap: tema.espaciado.m },
    fila: { flexDirection: 'row', gap: tema.espaciado.m },
    tecla: {
      flex: 1,
      minHeight: ALTO_TECLA,
      minWidth: ALTO_TECLA,
      borderRadius: tema.radios.boton,
      backgroundColor: tema.colores.superficieAlterna,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmar: {
      backgroundColor: tema.colores.confirmar,
      borderColor: tema.colores.confirmar,
    },
    inactiva: { opacity: 0.45 },
    // Capa de la escala: ocupa el hueco de la tecla en la fila. Los estilos que leen los tests
    // (alto mínimo, colores) siguen en el Pressable.
    hueco: { flex: 1 },
    destello: {
      ...StyleSheet.absoluteFill,
      borderRadius: tema.radios.boton,
      backgroundColor: tema.colores.marca,
    },
    destelloConfirmar: { backgroundColor: tema.colores.sobreConfirmar },
  });

/** Opacidad máxima del destello al pulsar una tecla. */
const OPACIDAD_DESTELLO = 0.22;

interface IPropsTecla {
  etiqueta: string;
  onPress: () => void;
  deshabilitada: boolean;
  confirmar?: boolean;
  children: ReactNode;
}

function Tecla({
  etiqueta,
  onPress,
  deshabilitada,
  confirmar = false,
  children,
}: IPropsTecla) {
  const estilos = useEstilos(crearEstilos);
  const { estiloEscala, alPresionar, alSoltar } = usePresionEscala(0.94);
  const destello = useSharedValue(0);
  const estiloDestello = useAnimatedStyle(() => ({ opacity: destello.value }));
  return (
    <Animated.View style={[estilos.hueco, estiloEscala]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityState={{ disabled: deshabilitada }}
        disabled={deshabilitada}
        onPress={deshabilitada ? undefined : onPress}
        onPressIn={() => {
          alPresionar();
          destello.value = withTiming(OPACIDAD_DESTELLO, { duration: 60 });
        }}
        onPressOut={() => {
          alSoltar();
          destello.value = withTiming(0, { duration: 220 });
        }}
        style={[
          estilos.tecla,
          confirmar && estilos.confirmar,
          deshabilitada && estilos.inactiva,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            estilos.destello,
            confirmar && estilos.destelloConfirmar,
            estiloDestello,
          ]}
        />
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Teclado 3×4 del lienzo: 1–9, borrar, 0 y confirmar. Cada tecla escala al pulsarla y destella
 * (F1-04); la escala va en una capa externa para no tocar los estilos del Pressable.
 */
export function TecladoPin({
  alPulsarDigito,
  alBorrar,
  alConfirmar,
  confirmarActivo,
  deshabilitado,
}: IPropsTecladoPin) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const digito = (d: string) => (
    <Tecla
      key={d}
      etiqueta={textosSesion.pin.digito(d)}
      onPress={() => alPulsarDigito(d)}
      deshabilitada={deshabilitado}
    >
      <Texto variante="h2">{d}</Texto>
    </Tecla>
  );
  return (
    <View style={estilos.teclado}>
      {FILAS.map(fila => (
        <View key={fila.join('')} style={estilos.fila}>
          {fila.map(digito)}
        </View>
      ))}
      <View style={estilos.fila}>
        <Tecla
          etiqueta={textosSesion.pin.borrar}
          onPress={alBorrar}
          deshabilitada={deshabilitado}
        >
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Zm-3.5 4-6 6m0-6 6 6"
              stroke={tema.colores.texto}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Tecla>
        {digito('0')}
        <Tecla
          etiqueta={textosSesion.pin.confirmar}
          onPress={alConfirmar}
          deshabilitada={deshabilitado || !confirmarActivo}
          confirmar
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="m5 12.5 4.5 4.5L19 7.5"
              stroke={tema.colores.sobreConfirmar}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Tecla>
      </View>
    </View>
  );
}
