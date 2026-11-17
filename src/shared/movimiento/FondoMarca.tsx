import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useTema } from '@/shared/theme';

import logo from '../../../assets/marca/logo.json';
import { duraciones, ESCALA_HALO } from './movimiento.tokens';

export interface IPropsFondoMarca {
  /**
   * Progreso horizontal del contenido (por ejemplo, la página del onboarding como fracción). El halo
   * se desplaza de izquierda a derecha entre 0 y `total - 1`.
   */
  progreso?: SharedValue<number>;
  /** Número de páginas que recorre `progreso`. Por defecto, 1 (el halo no se desplaza). */
  total?: number;
  /** Altura del centro del halo como fracción del alto de la ventana. Por defecto, 0.36. */
  alturaHalo?: number;
  /**
   * Dibuja el isotipo grande de fondo. Por defecto, sí. Se apaga donde el contenido ya es el logo
   * (el login): dos manos superpuestas no se entienden.
   */
  conIsotipo?: boolean;
  testID?: string;
}

/** Opacidad del isotipo de fondo («marca de agua»). */
const OPACIDAD_ISOTIPO = 0.07;
/** Opacidad del centro del halo (gradiente radial hacia transparente). */
const OPACIDAD_HALO = { oscuro: 0.32, claro: 0.4 } as const;
/** Ciclo completo de la deriva del isotipo. */
const DERIVA_ISOTIPO = 9000;

const { capas, viewBox } = logo.isotipo;

/**
 * Fondo de marca animado (F1-04), sin fotos: el fondo del tema, un halo verde que respira, el
 * isotipo grande y difuminado que deriva despacio y un gradiente hacia el fondo en la parte de
 * abajo, para que el contenido anclado (tarjeta, botones) se lea bien. Es decorativo: no recibe
 * toques ni se anuncia. Con reduce-motion queda quieto.
 */
export function FondoMarca({
  progreso,
  total = 1,
  alturaHalo = 0.36,
  conIsotipo = true,
  testID,
}: IPropsFondoMarca) {
  const { tema } = useTema();
  const c = tema.colores;
  const reducido = useReducedMotion();
  const { width: ancho, height: alto } = useWindowDimensions();
  const ladoHalo = ancho * 1.25;
  const ladoIsotipo = ancho * 1.05;
  const respiracion = useSharedValue(1);
  const deriva = useSharedValue(0);

  useEffect(() => {
    if (reducido) {
      return;
    }
    respiracion.value = withRepeat(
      withTiming(ESCALA_HALO, {
        duration: duraciones.respiracionHalo,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    deriva.value = withRepeat(
      withTiming(1, {
        duration: DERIVA_ISOTIPO / 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [reducido, respiracion, deriva]);

  const ultima = Math.max(total - 1, 1);
  const estiloHalo = useAnimatedStyle(() => {
    const p = progreso ? progreso.value : 0;
    return {
      transform: [
        {
          translateX:
            total > 1
              ? interpolate(p, [0, ultima], [-ancho * 0.18, ancho * 0.18])
              : 0,
        },
        { scale: respiracion.value },
      ],
    };
  });

  const estiloIsotipo = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(deriva.value, [0, 1], [-10, 10]) },
      { translateY: interpolate(deriva.value, [0, 1], [8, -8]) },
      { rotate: `${interpolate(deriva.value, [0, 1], [-4, 2])}deg` },
    ],
  }));

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: c.fondo }]}
    >
      <Animated.View
        style={[
          estilos.capa,
          {
            width: ladoHalo,
            height: ladoHalo,
            left: (ancho - ladoHalo) / 2,
            top: alto * alturaHalo - ladoHalo / 2,
          },
          estiloHalo,
        ]}
      >
        <Svg width={ladoHalo} height={ladoHalo}>
          <Defs>
            <RadialGradient id="haloMarca" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0"
                stopColor={c.halo}
                stopOpacity={OPACIDAD_HALO[tema.modo]}
              />
              <Stop
                offset="0.55"
                stopColor={c.halo}
                stopOpacity={OPACIDAD_HALO[tema.modo] / 4}
              />
              <Stop offset="1" stopColor={c.halo} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={ladoHalo} height={ladoHalo} fill="url(#haloMarca)" />
        </Svg>
      </Animated.View>
      {conIsotipo ? (
        <Animated.View
          style={[
            estilos.capa,
            {
              width: ladoIsotipo,
              height: ladoIsotipo,
              // Centrado en horizontal y a la altura del halo, detrás del contenido principal.
              left: (ancho - ladoIsotipo) / 2,
              top: alto * alturaHalo - ladoIsotipo / 2,
              opacity: OPACIDAD_ISOTIPO,
            },
            estiloIsotipo,
          ]}
        >
          <Svg width={ladoIsotipo} height={ladoIsotipo} viewBox={viewBox}>
            <Path d={capas.manoContorno} fill={c.marca} />
            <Path d={capas.letra} fill={c.marca} />
          </Svg>
        </Animated.View>
      ) : null}
      <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="fundidoFondo" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.fondo} stopOpacity={0} />
            <Stop offset="0.45" stopColor={c.fondo} stopOpacity={0} />
            <Stop offset="0.8" stopColor={c.fondo} stopOpacity={0.75} />
            <Stop offset="1" stopColor={c.fondo} stopOpacity={0.95} />
          </LinearGradient>
        </Defs>
        <Rect width={ancho} height={alto} fill="url(#fundidoFondo)" />
      </Svg>
    </View>
  );
}

const estilos = StyleSheet.create({
  capa: { position: 'absolute' },
});
