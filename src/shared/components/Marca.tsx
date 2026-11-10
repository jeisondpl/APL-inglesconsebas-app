import { StyleSheet, View } from 'react-native';

import { textosComunes } from '@/shared/lib/textos';
import { useTema } from '@/shared/theme';

import { LogoMarca } from './LogoMarca';
import { Texto } from './Texto';

export interface IPropsMarca {
  /** vertical: logo encima (splash A-M0); horizontal: logo a la izquierda (cabeceras). */
  disposicion?: 'vertical' | 'horizontal';
  /** Se anuncia como encabezado de la pantalla. */
  esEncabezado?: boolean;
  testID?: string;
}

const textos = textosComunes.marca;

/** Logo y wordmark «Inglés con Sebas», con «Sebas» en el color de marca. Se lee como una unidad. */
export function Marca({
  disposicion = 'vertical',
  esEncabezado = false,
  testID,
}: IPropsMarca) {
  const { tema } = useTema();
  const vertical = disposicion === 'vertical';
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={esEncabezado ? 'header' : 'text'}
      accessibilityLabel={textos.nombre}
      style={vertical ? estilos.vertical : estilos.horizontal}
    >
      <LogoMarca tamano={vertical ? 86 : 26} />
      <Texto
        variante={vertical ? 'h1' : 'subtitulo'}
        style={[
          { fontFamily: tema.familias.soraBold },
          vertical && estilos.centrado,
        ]}
      >
        {textos.inicio}
        <Texto variante={vertical ? 'h1' : 'subtitulo'} color="marca">
          {textos.destacado}
        </Texto>
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  vertical: { alignItems: 'center', gap: 20 },
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  centrado: { textAlign: 'center' },
});
