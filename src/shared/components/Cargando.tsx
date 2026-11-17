import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTema } from '@/shared/theme';

import { textosComponentes } from './componentes.textos';
import { Texto } from './Texto';

export interface IPropsCargando {
  /** Texto visible bajo el indicador. Si se omite, solo se anuncia «Cargando». */
  texto?: string;
  testID?: string;
}

/** Indicador de carga con el color de marca. */
export function Cargando({ texto, testID }: IPropsCargando) {
  const { tema } = useTema();
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={texto ?? textosComponentes.cargando}
      accessibilityState={{ busy: true }}
      style={estilos.contenedor}
    >
      <ActivityIndicator size="large" color={tema.colores.marca} />
      {texto ? (
        <Texto variante="detalle" color="textoSecundario">
          {texto}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', justifyContent: 'center', gap: 8 },
});
