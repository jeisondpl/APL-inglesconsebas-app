import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LogoMarca } from '@/shared/components/LogoMarca';
import { Texto } from '@/shared/components/Texto';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { duraciones, ESCALA_LOGO_CARGA } from './movimiento.tokens';

export interface IPropsPulsoCarga {
  /** Se anuncia como barra de progreso ocupada y se muestra bajo el logo. */
  etiqueta: string;
  /** Lado del isotipo. Por defecto, 72. */
  tamano?: number;
  testID?: string;
}

const LADO_ANILLO = 44;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    capa: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: tema.espaciado.l,
      zIndex: 20,
    },
    velo: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tema.colores.superficie,
      opacity: 0.94,
    },
    anillo: {
      width: LADO_ANILLO,
      height: LADO_ANILLO,
      borderRadius: LADO_ANILLO / 2,
      borderWidth: 3,
      borderColor: tema.colores.pista,
      borderTopColor: tema.colores.marca,
    },
  });

/**
 * Carga de marca (F1-04, `LoginLoadingOverlay` de Livic): cubre a su contenedor con un velo, el
 * isotipo que respira (1 ↔ 1.06) y un anillo que gira. Con reduce-motion solo aparece con un
 * fundido y queda quieto.
 */
export function PulsoCarga({
  etiqueta,
  tamano = 72,
  testID,
}: IPropsPulsoCarga) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const reducido = useReducedMotion();
  const aparicion = useSharedValue(0);
  const respiracion = useSharedValue(1);
  const giro = useSharedValue(0);

  useEffect(() => {
    aparicion.value = withTiming(1, { duration: duraciones.fundidoCorto });
    if (reducido) {
      return;
    }
    const medio = {
      duration: duraciones.respiracionLogo,
      easing: Easing.inOut(Easing.quad),
    };
    respiracion.value = withRepeat(
      withSequence(withTiming(ESCALA_LOGO_CARGA, medio), withTiming(1, medio)),
      -1,
    );
    giro.value = withRepeat(
      withTiming(360, {
        duration: duraciones.giroAnillo,
        easing: Easing.linear,
      }),
      -1,
    );
  }, [reducido, aparicion, respiracion, giro]);

  const estiloCapa = useAnimatedStyle(() => ({ opacity: aparicion.value }));
  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: respiracion.value }],
  }));
  const estiloAnillo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.value % 360}deg` }],
  }));

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
      style={[estilos.capa, estiloCapa]}
    >
      <View style={estilos.velo} />
      <Animated.View style={estiloLogo}>
        <LogoMarca
          tamano={tamano}
          categoria={tema.modo === 'oscuro' ? 'kids' : 'corporate'}
        />
      </Animated.View>
      <Animated.View style={[estilos.anillo, estiloAnillo]} />
      <Texto variante="etiqueta" color="textoSecundario">
        {etiqueta}
      </Texto>
    </Animated.View>
  );
}
