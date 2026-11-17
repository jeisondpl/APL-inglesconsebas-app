import { StyleSheet, View } from 'react-native';

import { useEstilos, type ITema } from '@/shared/theme';

import { textosOnboarding } from '../onboarding.textos';

const LADO_MARCA = 8;
const ANCHO_MARCA_ACTIVA = 22;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: tema.espaciado.s,
    },
    marca: {
      width: LADO_MARCA,
      height: LADO_MARCA,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.pista,
    },
    activa: { width: ANCHO_MARCA_ACTIVA, backgroundColor: tema.colores.marca },
  });

export interface IPropsIndicadorPaginas {
  indice: number;
  total: number;
}

/** Marcas de página: un solo elemento accesible que anuncia «Paso N de total». */
export function IndicadorPaginas({ indice, total }: IPropsIndicadorPaginas) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View
      testID="indicador-paginas"
      accessible
      accessibilityLabel={textosOnboarding.paso(indice + 1, total)}
      style={estilos.fila}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={i === indice ? 'marca-activa' : undefined}
          style={[estilos.marca, i === indice && estilos.activa]}
        />
      ))}
    </View>
  );
}
