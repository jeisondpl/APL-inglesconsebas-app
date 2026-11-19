import { StyleSheet, View } from 'react-native';

import {
  useEstilos,
  useTema,
  type IColoresTema,
  type ITema,
} from '@/shared/theme';

import { Texto } from './Texto';

export type TonoInsignia =
  | 'exito'
  | 'aviso'
  | 'peligro'
  | 'neutra'
  | 'contador';

export interface IPropsInsignia {
  texto: string;
  /** exito «Programada», aviso «Reagendo», peligro, neutra o contador (número sobre marca). */
  tono?: TonoInsignia;
  accessibilityLabel?: string;
  testID?: string;
}

const coloresPorTono: Record<
  TonoInsignia,
  { fondo: keyof IColoresTema; texto: keyof IColoresTema }
> = {
  exito: { fondo: 'exitoSuave', texto: 'sobreExitoSuave' },
  aviso: { fondo: 'avisoSuave', texto: 'sobreAvisoSuave' },
  peligro: { fondo: 'peligroSuave', texto: 'sobrePeligroSuave' },
  neutra: { fondo: 'superficieAlterna', texto: 'textoSecundario' },
  contador: { fondo: 'marca', texto: 'sobreMarca' },
};

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    insignia: {
      alignSelf: 'flex-start',
      borderRadius: tema.radios.pildora,
      paddingHorizontal: 11,
      paddingVertical: tema.espaciado.xs,
    },
  });

/** Píldora de estado (lámina A-M2/A-M3). */
export function Insignia({
  texto,
  tono = 'neutra',
  accessibilityLabel,
  testID,
}: IPropsInsignia) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const { fondo, texto: colorTexto } = coloresPorTono[tono];
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel ?? texto}
      style={[estilos.insignia, { backgroundColor: tema.colores[fondo] }]}
    >
      <Texto variante="insignia" color={colorTexto}>
        {texto}
      </Texto>
    </View>
  );
}
