import { StyleSheet, View } from 'react-native';

import { useEstilos, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';

export interface IPropsPuntosPin {
  escritos: number;
  total: number;
}

const TAMANO = 16;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: tema.espaciado.l,
      paddingVertical: tema.espaciado.s,
    },
    punto: {
      width: TAMANO,
      height: TAMANO,
      borderRadius: TAMANO / 2,
      borderWidth: 2,
      borderColor: tema.colores.bordeMarca,
    },
    lleno: {
      backgroundColor: tema.colores.marca,
      borderColor: tema.colores.marca,
    },
  });

/** Cuatro puntos que se rellenan con `marca`. Se anuncian como «PIN: 2 de 4 dígitos». */
export function PuntosPin({ escritos, total }: IPropsPuntosPin) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={textosSesion.pin.puntos(escritos, total)}
      style={estilos.fila}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={i < escritos ? 'punto-lleno' : 'punto-vacio'}
          style={[estilos.punto, i < escritos && estilos.lleno]}
        />
      ))}
    </View>
  );
}
