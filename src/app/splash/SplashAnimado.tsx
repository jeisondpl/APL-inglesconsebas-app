import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useNative } from '@/app/di';
import { Marca, Texto } from '@/shared/components';
import { duraciones, ESCALA_HALO, resortes } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { textosSplash } from './splash.textos';

/** Ancho del logo del splash nativo (scripts/generar-splash.mjs, ANCHO_LOGO). */
export const ANCHO_LOGO_SPLASH = 160;
/** Duración mínima visible del splash, para que la coreografía se aprecie (Livic). */
export const MINIMO_SPLASH_MS = 1900;
/** Con reduce-motion el splash es corto y solo funde. */
export const MINIMO_SPLASH_REDUCIDO_MS = 600;
/** Lo más que se espera a la restauración después del mínimo: el splash nunca se cuelga. */
export const ESPERA_MAXIMA_MS = 1200;
/** Duración de la salida (logo a 1.12 y fundido) antes de llamar a `alTerminar`. */
export const SALIDA_MS = 460;

const PALABRAS = textosSplash.eslogan.split(' ');
const OPACIDAD_HALO = 0.16;

export interface IPropsSplashAnimado {
  /** `true` cuando ya se restauraron la sesión y la bandera de la bienvenida. */
  listo: boolean;
  /** Se llama una vez, al acabar la salida. */
  alTerminar: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    raiz: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tema.colores.fondo,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    capa: { position: 'absolute' },
    anillo: {
      position: 'absolute',
      borderWidth: 1.5,
      borderColor: tema.colores.halo,
    },
    eslogan: {
      position: 'absolute',
      left: tema.espaciado.xxl,
      right: tema.espaciado.xxl,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      columnGap: tema.espaciado.xs + 1,
    },
  });

/** Una palabra del eslogan con entrada escalonada (`TaglineWord` de Livic). */
function PalabraEslogan({
  palabra,
  retraso,
  reducido,
}: {
  palabra: string;
  retraso: number;
  reducido: boolean;
}) {
  const opacidad = useSharedValue(0);
  const y = useSharedValue(reducido ? 0 : 10);

  useEffect(() => {
    if (reducido) {
      opacidad.value = withTiming(1, { duration: duraciones.fundidoCorto });
      return;
    }
    opacidad.value = withDelay(retraso, withTiming(1, { duration: 380 }));
    y.value = withDelay(
      retraso,
      withSpring(0, { damping: 14, stiffness: 140 }),
    );
  }, [reducido, retraso, opacidad, y]);

  const estilo = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={estilo}>
      <Texto color="textoSecundario">{palabra}</Texto>
    </Animated.View>
  );
}

/**
 * Splash animado en JS (F1-04, `SplashScreen` de Livic). Arranca idéntico al splash nativo (fondo
 * del tema y el logo principal de 160 dp centrado), así que al ocultar el nativo sin fundido el
 * corte no se ve. Después: halo verde que crece y respira, un anillo que irradia una vez, el logo que
 * se asienta con un resorte y el eslogan palabra por palabra. Termina tras el mínimo y la
 * restauración (con un tope), con el logo creciendo a 1.12 y un fundido. Con reduce-motion: 600 ms
 * y solo fundido.
 */
export function SplashAnimado({ listo, alTerminar }: IPropsSplashAnimado) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const splashNativo = useNative('splash');
  const reducido = useReducedMotion();
  const { width: ancho, height: alto } = useWindowDimensions();
  const ladoHalo = ancho * 1.1;
  const [minimoCumplido, setMinimoCumplido] = useState(false);
  const [esperaAgotada, setEsperaAgotada] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const terminado = useRef(false);
  const alTerminarRef = useRef(alTerminar);
  useEffect(() => {
    alTerminarRef.current = alTerminar;
  }, [alTerminar]);

  const pantalla = useSharedValue(1);
  const haloOpacidad = useSharedValue(0);
  const haloEscala = useSharedValue(0.55);
  const anilloOpacidad = useSharedValue(0);
  const anilloEscala = useSharedValue(0.4);
  const logoEscala = useSharedValue(1);

  // El JS ya pinta lo mismo que el nativo: se oculta sin fundido para que el cambio no se note.
  useEffect(() => {
    splashNativo.ocultar({ fundido: false });
  }, [splashNativo]);

  // Entrada.
  useEffect(() => {
    if (reducido) {
      return;
    }
    haloOpacidad.value = withDelay(
      120,
      withTiming(OPACIDAD_HALO, { duration: 700 }),
    );
    haloEscala.value = withDelay(
      120,
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withRepeat(
          withTiming(ESCALA_HALO, {
            duration: duraciones.respiracionHalo,
            easing: Easing.inOut(Easing.quad),
          }),
          -1,
          true,
        ),
      ),
    );
    anilloOpacidad.value = withDelay(
      420,
      withSequence(
        withTiming(0.35, { duration: 200 }),
        withTiming(0, { duration: 900 }),
      ),
    );
    anilloEscala.value = withDelay(
      420,
      withTiming(1.5, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    // El logo ya está a escala 1 (como el nativo): baja un poco y aterriza con resorte.
    logoEscala.value = withDelay(
      180,
      withSequence(
        withTiming(0.85, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(1, resortes.logo),
      ),
    );
  }, [
    reducido,
    haloOpacidad,
    haloEscala,
    anilloOpacidad,
    anilloEscala,
    logoEscala,
  ]);

  // Puerta 1: duración mínima.
  useEffect(() => {
    const t = setTimeout(
      () => setMinimoCumplido(true),
      reducido ? MINIMO_SPLASH_REDUCIDO_MS : MINIMO_SPLASH_MS,
    );
    return () => clearTimeout(t);
  }, [reducido]);

  // Puerta 2: restauración, con tope tras el mínimo para no colgarse nunca.
  useEffect(() => {
    if (!minimoCumplido || listo) {
      return undefined;
    }
    const t = setTimeout(() => setEsperaAgotada(true), ESPERA_MAXIMA_MS);
    return () => clearTimeout(t);
  }, [minimoCumplido, listo]);

  const puedeSalir = minimoCumplido && (listo || esperaAgotada);

  // La salida se programa una sola vez; solo se cancela si el splash se desmonta antes.
  const temporizadorSalida = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (temporizadorSalida.current) {
        clearTimeout(temporizadorSalida.current);
      }
    },
    [],
  );

  // Salida.
  useEffect(() => {
    if (!puedeSalir || terminado.current) {
      return;
    }
    terminado.current = true;
    setSaliendo(true);
    if (!reducido) {
      logoEscala.value = withTiming(1.12, {
        duration: 420,
        easing: Easing.in(Easing.cubic),
      });
      haloOpacidad.value = withTiming(0, { duration: 380 });
    }
    pantalla.value = withDelay(
      reducido ? 0 : 120,
      withTiming(0, { duration: 340 }),
    );
    temporizadorSalida.current = setTimeout(
      () => alTerminarRef.current(),
      SALIDA_MS,
    );
  }, [puedeSalir, reducido, logoEscala, haloOpacidad, pantalla]);

  const estiloPantalla = useAnimatedStyle(() => ({ opacity: pantalla.value }));
  const estiloHalo = useAnimatedStyle(() => ({
    opacity: haloOpacidad.value,
    transform: [{ scale: haloEscala.value }],
  }));
  const estiloAnillo = useAnimatedStyle(() => ({
    opacity: anilloOpacidad.value,
    transform: [{ scale: anilloEscala.value }],
  }));
  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: logoEscala.value }],
  }));

  const ladoAnillo = ladoHalo * 0.8;
  return (
    <Animated.View
      testID="splash-animado"
      pointerEvents={saliendo ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[estilos.raiz, estiloPantalla]}
    >
      <Animated.View
        style={[
          estilos.capa,
          { width: ladoHalo, height: ladoHalo },
          estiloHalo,
        ]}
      >
        <Svg width={ladoHalo} height={ladoHalo}>
          <Defs>
            <RadialGradient id="haloSplash" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={tema.colores.halo} stopOpacity={1} />
              <Stop
                offset="0.6"
                stopColor={tema.colores.halo}
                stopOpacity={0.35}
              />
              <Stop offset="1" stopColor={tema.colores.halo} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={ladoHalo} height={ladoHalo} fill="url(#haloSplash)" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          estilos.anillo,
          {
            width: ladoAnillo,
            height: ladoAnillo,
            borderRadius: ladoAnillo / 2,
          },
          estiloAnillo,
        ]}
      />
      <Animated.View testID="splash-logo" style={estiloLogo}>
        <Marca ancho={ANCHO_LOGO_SPLASH} />
      </Animated.View>
      <View style={[estilos.eslogan, { top: alto / 2 + 72 }]}>
        {PALABRAS.map((palabra, i) => (
          <PalabraEslogan
            key={`${palabra}-${i}`}
            palabra={palabra}
            retraso={620 + i * 80}
            reducido={reducido}
          />
        ))}
      </View>
    </Animated.View>
  );
}
