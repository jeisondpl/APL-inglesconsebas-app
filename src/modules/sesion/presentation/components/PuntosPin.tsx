import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { duraciones, useSacudida } from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';

export interface IPropsPuntosPin {
  escritos: number;
  total: number;
  /**
   * `true` mientras se muestra un error del login. Al pasar de `false` a `true` los puntos se
   * sacuden y se ven en rojo 300 ms (F1-04).
   */
  conError?: boolean;
}

const TAMANO = 16;
/** Escala del «pop» al llenarse un punto: 0 → 1.15 → 1. */
const ESCALA_POP = 1.15;

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
    error: {
      backgroundColor: tema.colores.peligro,
      borderColor: tema.colores.peligro,
    },
  });

type EstadoPunto = 'vacio' | 'lleno' | 'error';

const TEST_ID: Record<EstadoPunto, string> = {
  vacio: 'punto-vacio',
  lleno: 'punto-lleno',
  error: 'punto-error',
};

/** Un punto: al llenarse hace un pequeño «pop» (con reduce-motion, aparece sin escalar). */
function PuntoPin({
  estado,
  estilos,
}: {
  estado: EstadoPunto;
  estilos: ReturnType<typeof crearEstilos>;
}) {
  const reducido = useReducedMotion();
  const escala = useSharedValue(1);
  const anterior = useRef(estado);

  useEffect(() => {
    if (anterior.current !== 'lleno' && estado === 'lleno' && !reducido) {
      escala.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(ESCALA_POP, { duration: 120 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
    anterior.current = estado;
  }, [estado, reducido, escala]);

  const estiloPop = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  return (
    <Animated.View
      testID={TEST_ID[estado]}
      style={[
        estilos.punto,
        estado === 'lleno' && estilos.lleno,
        estado === 'error' && estilos.error,
        estiloPop,
      ]}
    />
  );
}

/**
 * Cuatro puntos que se rellenan con `marca`. Se anuncian como «PIN: 2 de 4 dígitos». Cada punto
 * hace un «pop» al llenarse y, si llega un error, la fila se sacude y se ve en rojo 300 ms.
 */
export function PuntosPin({
  escritos,
  total,
  conError = false,
}: IPropsPuntosPin) {
  const estilos = useEstilos(crearEstilos);
  const { estiloSacudida, sacudir } = useSacudida();
  const [enRojo, setEnRojo] = useState(false);
  const habiaError = useRef(conError);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (conError && !habiaError.current) {
      sacudir();
      setEnRojo(true);
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
      temporizador.current = setTimeout(
        () => setEnRojo(false),
        duraciones.errorPin,
      );
    } else if (!conError) {
      setEnRojo(false);
    }
    habiaError.current = conError;
  }, [conError, sacudir]);

  useEffect(
    () => () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
    },
    [],
  );

  // Si se vuelve a escribir, el rojo se va enseguida.
  const rojo = enRojo && escritos === 0;
  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={textosSesion.pin.puntos(escritos, total)}
      style={[estilos.fila, estiloSacudida]}
    >
      {Array.from({ length: total }, (_, i) => (
        <PuntoPin
          key={i}
          estado={rojo ? 'error' : i < escritos ? 'lleno' : 'vacio'}
          estilos={estilos}
        />
      ))}
    </Animated.View>
  );
}
