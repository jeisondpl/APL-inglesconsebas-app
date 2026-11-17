import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { usePresionEscala } from '@/shared/movimiento/usePresionEscala';
import {
  coloresGoogle,
  coloresLogoGoogle,
  familias,
  useTema,
  type ITema,
  useEstilos,
} from '@/shared/theme';

import { ALTO_BOTON } from './Boton';
import { textosComponentes } from './componentes.textos';

export interface IPropsBotonGoogle {
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  testID?: string;
}

const crearEstilos = (tema: ITema) => {
  const google = coloresGoogle[tema.modo];
  return StyleSheet.create({
    boton: {
      minHeight: ALTO_BOTON,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tema.espaciado.m,
      paddingHorizontal: tema.espaciado.xl,
      borderRadius: tema.radios.pildora,
      borderWidth: 1,
      borderColor: google.borde,
      backgroundColor: google.relleno,
    },
    inactivo: { opacity: 0.6 },
    logo: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Excepción de marca: Google pide Roboto Medium en su botón. En Android es la fuente del
    // sistema (`sans-serif-medium`); iOS no trae Roboto y se usa DM Sans Medium. Por eso `Text`.
    texto: {
      color: google.texto,
      fontSize: 15,
      fontFamily: Platform.select({
        android: 'sans-serif-medium',
        default: familias.dmSansMedium,
      }),
    },
  });
};

/** La «G» oficial de Google a cuatro colores (no se recolorea). */
function LogoGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill={coloresLogoGoogle.rojo}
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill={coloresLogoGoogle.azul}
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill={coloresLogoGoogle.amarillo}
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill={coloresLogoGoogle.verde}
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

/**
 * «Continuar con Google» según las guías de marca de Google (píldora, claro u oscuro según el tema,
 * la «G» sin alterar). Copia del botón del login de Livic, con colores desde el tema.
 */
export function BotonGoogle({
  onPress,
  cargando = false,
  deshabilitado = false,
  testID,
}: IPropsBotonGoogle) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const { estiloEscala, alPresionar, alSoltar } = usePresionEscala();
  const inactivo = deshabilitado || cargando;
  return (
    <PressableAnimado
      testID={testID}
      onPress={onPress}
      onPressIn={alPresionar}
      onPressOut={alSoltar}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={textosComponentes.continuarConGoogle}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={[estilos.boton, inactivo && estilos.inactivo, estiloEscala]}
    >
      <View style={estilos.logo}>
        {cargando ? (
          <ActivityIndicator
            size="small"
            color={coloresGoogle[tema.modo].texto}
          />
        ) : (
          <LogoGoogle />
        )}
      </View>
      <Text style={estilos.texto} numberOfLines={1}>
        {textosComponentes.continuarConGoogle}
      </Text>
    </PressableAnimado>
  );
}
