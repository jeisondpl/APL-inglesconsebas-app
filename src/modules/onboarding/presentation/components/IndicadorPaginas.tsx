import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

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
      overflow: 'hidden',
      backgroundColor: tema.colores.pista,
    },
    activa: { width: ANCHO_MARCA_ACTIVA, backgroundColor: tema.colores.marca },
    // Capas del color interpolado: la pista opaca tapa el color discreto y el verde aparece encima
    // según lo cerca que esté el scroll de la página.
    capaPista: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tema.colores.pista,
    },
    capaMarca: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tema.colores.marca,
    },
  });

export interface IPropsIndicadorPaginas {
  indice: number;
  total: number;
  /**
   * Página como fracción mientras se desliza (scrollX / ancho). Con él, el ancho (8 → 22) y el color
   * de cada marca se interpolan sin saltos; sin él, siguen a `indice`.
   */
  progreso?: SharedValue<number>;
}

interface IPropsMarcaPagina {
  i: number;
  activa: boolean;
  progreso?: SharedValue<number>;
  estilos: ReturnType<typeof crearEstilos>;
}

/** Una marca: el estilo discreto de siempre más el ancho y el color que siguen al scroll. */
function MarcaPagina({ i, activa, progreso, estilos }: IPropsMarcaPagina) {
  const cercania = () => {
    'worklet';
    const p = progreso ? progreso.value : activa ? i : i + 1;
    return interpolate(p, [i - 1, i, i + 1], [0, 1, 0], Extrapolation.CLAMP);
  };
  const estiloAncho = useAnimatedStyle(() => ({
    width: interpolate(cercania(), [0, 1], [LADO_MARCA, ANCHO_MARCA_ACTIVA]),
  }));
  const estiloColor = useAnimatedStyle(() => ({ opacity: cercania() }));
  return (
    <Animated.View
      testID={activa ? 'marca-activa' : undefined}
      style={[estilos.marca, activa && estilos.activa, estiloAncho]}
    >
      <View style={estilos.capaPista} />
      <Animated.View style={[estilos.capaMarca, estiloColor]} />
    </Animated.View>
  );
}

/** Marcas de página: un solo elemento accesible que anuncia «Paso N de total». */
export function IndicadorPaginas({
  indice,
  total,
  progreso,
}: IPropsIndicadorPaginas) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View
      testID="indicador-paginas"
      accessible
      accessibilityLabel={textosOnboarding.paso(indice + 1, total)}
      style={estilos.fila}
    >
      {Array.from({ length: total }, (_, i) => (
        <MarcaPagina
          key={i}
          i={i}
          activa={i === indice}
          progreso={progreso}
          estilos={estilos}
        />
      ))}
    </View>
  );
}
