import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '@/shared/components';
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
    pulsada: { opacity: 0.7 },
  });

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitada }}
      disabled={deshabilitada}
      onPress={deshabilitada ? undefined : onPress}
      style={({ pressed }) => [
        estilos.tecla,
        confirmar && estilos.confirmar,
        deshabilitada && estilos.inactiva,
        pressed && estilos.pulsada,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Teclado 3×4 del lienzo: 1–9, borrar, 0 y confirmar. */
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
