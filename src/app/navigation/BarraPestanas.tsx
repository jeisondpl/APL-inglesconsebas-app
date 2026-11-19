import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '@/shared/components/Texto';
import type { ComponenteIcono } from '@/shared/iconos';
import { useEstadoBarraPestanas } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

/**
 * Barra de pestañas inferior (F1-05): copia fiel de `LivicTabBar` de APL-Livic-movil con los tokens
 * de la marca. Barra SVG de 72 con una hendidura que viaja con resorte hasta la pestaña activa,
 * círculo elevado de 58 con el ícono activo (pop al cambiar), íconos inactivos que se apagan en la
 * activa, etiqueta con color interpolado y press-scale de 0.94. Se oculta con el teclado y al
 * desplazar hacia abajo (`useOcultarBarraAlDesplazar`). Con reduce-motion todo es instantáneo.
 */

export interface IPestanaBarra<Id extends string = string> {
  id: Id;
  etiqueta: string;
  Icono: ComponenteIcono;
  /** Contador (no leídos). Sin insignia con 0 o `undefined`. */
  insignia?: number;
  /** Etiqueta accesible de la insignia, p. ej. «2 mensajes sin leer». */
  etiquetaInsignia?: string;
}

export interface IPropsBarraPestanas<Id extends string = string> {
  pestanas: readonly IPestanaBarra<Id>[];
  activa: Id;
  alCambiar: (id: Id) => void;
}

const ALTO_BARRA = 72;
const RADIO_ESQUINA = 16;
const LADO_CIRCULO = 58;
const MEDIO_ANCHO_HENDIDURA = 32;
const HOMBRO_HENDIDURA = 10;
const PROFUNDIDAD_HENDIDURA = 32;
/** Centro elevado para dejar un espacio visible entre círculo y hendidura. */
const ELEVACION_CIRCULO = -2;
/** Parte del círculo que sobresale por encima de la barra. */
const SOBRESALE_CIRCULO = LADO_CIRCULO / 2 - ELEVACION_CIRCULO;
/** Aire sobre la barra para el círculo y el rebote de su resorte. */
const AIRE_SUPERIOR = SOBRESALE_CIRCULO + 8;
/** Escala de una pestaña mientras se pulsa (Livic). */
export const ESCALA_PESTANA = 0.94;
/** Más de esto se muestra como «9+». */
const MAX_INSIGNIA = 9;

const RESORTE = { damping: 15, stiffness: 160, mass: 0.9 };
const RESORTE_POP = { damping: 12, stiffness: 260 };

const TrazoAnimado = Animated.createAnimatedComponent(Path);
/** Margen del trazo dentro del lienzo SVG: así el borde no se recorta en los extremos. */
const MARGEN_TRAZO = 1;

type Medida = { x: number; width: number };

/**
 * Rectángulo redondeado con una hendidura de hombros suaves. La curva viaja con la pestaña activa
 * y se recalcula con el ancho realmente medido.
 */
export function trazoBarra(
  ancho: number,
  alto: number,
  centro: number,
): string {
  'worklet';
  const tramo = MEDIO_ANCHO_HENDIDURA + HOMBRO_HENDIDURA;
  if (ancho <= RADIO_ESQUINA * 2 + tramo * 2) {
    return '';
  }
  const r = RADIO_ESQUINA;
  const cx = Math.max(r + tramo + 2, Math.min(ancho - r - tramo - 2, centro));
  const hombroIzq = cx - tramo;
  const cuencoIzq = cx - MEDIO_ANCHO_HENDIDURA;
  const cuencoDer = cx + MEDIO_ANCHO_HENDIDURA;
  const hombroDer = cx + tramo;
  const p = PROFUNDIDAD_HENDIDURA;

  return [
    `M ${r} 0`,
    `H ${hombroIzq}`,
    `C ${hombroIzq + 7} 0 ${cuencoIzq - 3} 3 ${cuencoIzq} 11`,
    `C ${cuencoIzq + 5} 25 ${cx - 15} ${p} ${cx} ${p}`,
    `C ${cx + 15} ${p} ${cuencoDer - 5} 25 ${cuencoDer} 11`,
    `C ${cuencoDer + 3} 3 ${hombroDer - 7} 0 ${hombroDer} 0`,
    `H ${ancho - r}`,
    `A ${r} ${r} 0 0 1 ${ancho} ${r}`,
    `V ${alto - r}`,
    `A ${r} ${r} 0 0 1 ${ancho - r} ${alto}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${alto - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

/** Texto de la insignia: el número, o «9+» desde 10. `null` si no hay que mostrarla. */
export function textoInsignia(cantidad: number | undefined): string | null {
  if (!cantidad || cantidad <= 0) {
    return null;
  }
  return cantidad > MAX_INSIGNIA ? `${MAX_INSIGNIA}+` : String(cantidad);
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    dock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 18,
      paddingTop: AIRE_SUPERIOR,
    },
    contenedor: { position: 'relative', height: ALTO_BARRA },
    svg: { position: 'absolute', left: 0, top: 0 },
    respaldo: {
      ...StyleSheet.absoluteFill,
      borderRadius: RADIO_ESQUINA,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: tema.colores.superficie,
      borderColor: tema.colores.borde,
    },
    circulo: {
      position: 'absolute',
      top: -(LADO_CIRCULO / 2) + ELEVACION_CIRCULO,
      left: 0,
      width: LADO_CIRCULO,
      height: LADO_CIRCULO,
      zIndex: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    anillo: {
      width: LADO_CIRCULO,
      height: LADO_CIRCULO,
      borderRadius: LADO_CIRCULO / 2,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.marca,
      borderColor: tema.colores.superficie,
    },
    fila: {
      ...StyleSheet.absoluteFill,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tema.espaciado.s,
      zIndex: 5,
    },
    pestana: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    interior: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: tema.espaciado.xs,
    },
    hueco: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    etiqueta: {
      fontFamily: tema.familias.dmSansMedium,
      fontSize: 10.5,
      lineHeight: 14,
      letterSpacing: 0.2,
    },
    etiquetaActiva: { fontFamily: tema.familias.dmSansSemiBold },
    insignia: {
      position: 'absolute',
      top: -6,
      right: -12,
      minWidth: 18,
      paddingHorizontal: 5,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.marca,
      alignItems: 'center',
    },
  });

export function BarraPestanas<Id extends string>({
  pestanas,
  activa,
  alCambiar,
}: IPropsBarraPestanas<Id>) {
  const insets = useSafeAreaInsets();
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const reducido = useReducedMotion();
  const estadoBarra = useEstadoBarraPestanas();
  // 8–12 dp de aire sobre el borde inferior seguro.
  const aireInferior = insets.bottom + 10;
  const indiceActivo = Math.max(
    0,
    pestanas.findIndex(p => p.id === activa),
  );
  const IconoActivo = pestanas[indiceActivo]?.Icono;

  const [anchoBarra, setAnchoBarra] = useState(0);
  const anchoSv = useSharedValue(0);
  const [medidas, setMedidas] = useState<Medida[]>(() =>
    pestanas.map(() => ({ x: 0, width: 0 })),
  );

  const circuloX = useSharedValue(0);
  const centroHendidura = useSharedValue(0);
  const progreso = useSharedValue(indiceActivo);
  const opacidadCirculo = useSharedValue(0);
  const pop = useSharedValue(1);
  const iniciado = useRef(false);

  // Teclado: la barra se esconde para no quedar flotando sobre él.
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const ocultaTeclado = useSharedValue(0);
  // Scroll: se oculta al bajar y reaparece al subir.
  const ocultaScroll = useSharedValue(0);
  const direccionLocal = useSharedValue(0);
  const direccion = estadoBarra?.direccion ?? direccionLocal;

  useEffect(() => {
    const alMostrar =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const alOcultar =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const mostrar = Keyboard.addListener(alMostrar, () => {
      setTecladoVisible(true);
      ocultaTeclado.value = withTiming(1, { duration: reducido ? 0 : 180 });
    });
    const ocultar = Keyboard.addListener(alOcultar, () => {
      setTecladoVisible(false);
      ocultaTeclado.value = withTiming(0, { duration: reducido ? 0 : 220 });
    });
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, [ocultaTeclado, reducido]);

  // La reacción compara el número de la dirección, no la identidad del contenedor.
  useAnimatedReaction(
    () => direccion.value,
    dir => {
      if (dir === 1) {
        ocultaScroll.value = withTiming(1, { duration: reducido ? 0 : 250 });
      } else if (dir === -1) {
        ocultaScroll.value = withTiming(0, { duration: reducido ? 0 : 250 });
      }
    },
  );

  const alMedirBarra = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      setAnchoBarra(w);
      anchoSv.value = w;
    },
    [anchoSv],
  );

  const alMedirPestana = useCallback((indice: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setMedidas(previas => {
      if (previas[indice]?.x === x && previas[indice]?.width === width) {
        return previas;
      }
      const siguientes = [...previas];
      siguientes[indice] = { x, width };
      return siguientes;
    });
  }, []);

  const destino = useMemo(() => {
    const medida = medidas[indiceActivo];
    if (!medida || medida.width === 0) {
      return null;
    }
    const centro = medida.x + medida.width / 2;
    return { x: centro - LADO_CIRCULO / 2, cx: centro };
  }, [medidas, indiceActivo]);

  useEffect(() => {
    if (destino == null) {
      return;
    }
    // Primera medición: se coloca sin animar (evita el destello desde x = 0).
    if (!iniciado.current) {
      iniciado.current = true;
      circuloX.value = destino.x;
      centroHendidura.value = destino.cx;
      progreso.value = indiceActivo;
      opacidadCirculo.value = withTiming(1, { duration: reducido ? 0 : 220 });
      return;
    }
    if (reducido) {
      circuloX.value = withTiming(destino.x, { duration: 0 });
      centroHendidura.value = withTiming(destino.cx, { duration: 0 });
      progreso.value = withTiming(indiceActivo, { duration: 0 });
      return;
    }
    circuloX.value = withSpring(destino.x, RESORTE);
    centroHendidura.value = withSpring(destino.cx, RESORTE);
    progreso.value = withSpring(indiceActivo, RESORTE);
    // Pequeño pulso del círculo al cambiar de pestaña.
    pop.value = 0.86;
    pop.value = withSpring(1, RESORTE_POP);
  }, [
    destino,
    indiceActivo,
    circuloX,
    centroHendidura,
    progreso,
    opacidadCirculo,
    pop,
    reducido,
  ]);

  const propsTrazo = useAnimatedProps(() => ({
    d: trazoBarra(
      anchoSv.value - MARGEN_TRAZO * 2,
      ALTO_BARRA - MARGEN_TRAZO * 2,
      centroHendidura.value - MARGEN_TRAZO,
    ),
  }));

  const estiloCirculo = useAnimatedStyle(() => ({
    opacity: opacidadCirculo.value,
    transform: [{ translateX: circuloX.value }, { scale: pop.value }],
  }));

  const estiloDock = useAnimatedStyle(() => ({
    opacity: (1 - ocultaTeclado.value) * (1 - ocultaScroll.value),
    transform: [
      {
        translateY: interpolate(
          Math.max(ocultaTeclado.value, ocultaScroll.value),
          [0, 1],
          [0, ALTO_BARRA + SOBRESALE_CIRCULO + 40],
        ),
      },
    ],
  }));

  return (
    <Animated.View
      testID="barra-pestanas"
      accessibilityRole="tablist"
      style={[estilos.dock, { paddingBottom: aireInferior }, estiloDock]}
      pointerEvents={tecladoVisible ? 'none' : 'box-none'}
    >
      <View style={estilos.contenedor} onLayout={alMedirBarra}>
        {anchoBarra > 0 ? (
          <Svg width={anchoBarra} height={ALTO_BARRA} style={estilos.svg}>
            <TrazoAnimado
              x={MARGEN_TRAZO}
              y={MARGEN_TRAZO}
              animatedProps={propsTrazo}
              fill={tema.colores.superficie}
              stroke={tema.colores.borde}
              strokeWidth={StyleSheet.hairlineWidth * 2}
            />
          </Svg>
        ) : (
          <View style={estilos.respaldo} />
        )}

        {/* Círculo viajero de alto contraste: lleva el ícono de la pestaña activa. */}
        <Animated.View
          style={[estilos.circulo, estiloCirculo]}
          pointerEvents="none"
        >
          <View style={estilos.anillo}>
            {IconoActivo ? (
              <IconoActivo
                tamano={24}
                color={tema.colores.sobreMarca}
                testID="icono-pestana-activa"
              />
            ) : null}
          </View>
        </Animated.View>

        <View style={estilos.fila}>
          {pestanas.map((pestana, indice) => (
            <Pestana
              key={pestana.id}
              indice={indice}
              pestana={pestana}
              seleccionada={pestana.id === activa}
              progreso={progreso}
              reducido={reducido}
              colorActivo={tema.colores.marca}
              colorInactivo={tema.colores.textoSecundario}
              estilos={estilos}
              alMedir={e => alMedirPestana(indice, e)}
              alPulsar={() => alCambiar(pestana.id)}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

interface IPropsPestana<Id extends string> {
  indice: number;
  pestana: IPestanaBarra<Id>;
  seleccionada: boolean;
  progreso: SharedValue<number>;
  reducido: boolean;
  colorActivo: string;
  colorInactivo: string;
  estilos: ReturnType<typeof crearEstilos>;
  alMedir: (e: LayoutChangeEvent) => void;
  alPulsar: () => void;
}

function Pestana<Id extends string>({
  indice,
  pestana,
  seleccionada,
  progreso,
  reducido,
  colorActivo,
  colorInactivo,
  estilos,
  alMedir,
  alPulsar,
}: IPropsPestana<Id>) {
  const escala = useSharedValue(1);
  const { Icono } = pestana;
  // En la pestaña activa no hace falta la insignia: ya se está viendo esa sección.
  const insignia = seleccionada ? null : textoInsignia(pestana.insignia);

  const estiloIcono = useAnimatedStyle(() => {
    // El ícono de la pestaña activa se apaga: ya vive en el círculo elevado.
    const distancia = Math.abs(progreso.value - indice);
    return { opacity: interpolate(distancia, [0, 0.25], [0, 1], 'clamp') };
  });

  const estiloEtiqueta = useAnimatedStyle(() => {
    const distancia = Math.abs(progreso.value - indice);
    return {
      color: interpolateColor(distancia, [0, 1], [colorActivo, colorInactivo]),
    };
  });

  const estiloPresion = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const etiquetaAccesible =
    insignia && pestana.etiquetaInsignia
      ? `${pestana.etiqueta}, ${pestana.etiquetaInsignia}`
      : pestana.etiqueta;

  return (
    <Pressable
      testID={`pestana-${pestana.id}`}
      onPress={alPulsar}
      onLongPress={alPulsar}
      onPressIn={() => {
        if (!reducido) {
          escala.value = withSpring(ESCALA_PESTANA, RESORTE);
        }
      }}
      onPressOut={() => {
        if (!reducido) {
          escala.value = withSpring(1, RESORTE);
        }
      }}
      onLayout={alMedir}
      style={estilos.pestana}
      hitSlop={{ top: SOBRESALE_CIRCULO + 6, right: 4, bottom: 6, left: 4 }}
      accessibilityRole="tab"
      accessibilityLabel={etiquetaAccesible}
      accessibilityState={{ selected: seleccionada }}
    >
      <Animated.View style={[estilos.interior, estiloPresion]}>
        <View style={estilos.hueco}>
          <Animated.View style={estiloIcono}>
            <Icono tamano={20} color={colorInactivo} />
          </Animated.View>
          {insignia ? (
            <View
              style={estilos.insignia}
              testID={`insignia-${pestana.id}`}
              importantForAccessibility="no-hide-descendants"
            >
              <Texto variante="insignia" color="sobreMarca">
                {insignia}
              </Texto>
            </View>
          ) : null}
        </View>
        <Animated.Text
          style={[
            estilos.etiqueta,
            seleccionada && estilos.etiquetaActiva,
            { color: seleccionada ? colorActivo : colorInactivo },
            estiloEtiqueta,
          ]}
        >
          {pestana.etiqueta}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
