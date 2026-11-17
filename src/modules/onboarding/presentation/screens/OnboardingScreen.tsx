import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Boton, LogoMarca, Pantalla, Texto } from '@/shared/components';
import {
  duraciones,
  FondoMarca,
  Revelar,
  usePresionEscala,
} from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useOnboardingController } from '../../aplications/controllers/Onboarding.controller';
import { categoriaIsotipoPorModo } from '../components/IlustracionBienvenida';
import { IndicadorPaginas } from '../components/IndicadorPaginas';
import { PaginaOnboarding } from '../components/PaginaOnboarding';
import {
  PAGINAS_ONBOARDING,
  type IPaginaOnboarding,
} from '../onboarding.config';
import { textosOnboarding } from '../onboarding.textos';

/** Lado del botón atrás que aparece con el scroll (backReveal de Livic). */
const LADO_ATRAS = 48;
/** Retrasos de la entrada de O1 (plan F1-04): logo 100 ms y pie 600 ms. */
const RETRASO_LOGO = 100;
const RETRASO_PIE = 600;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    // Sin padding horizontal: cada página ocupa todo el ancho de la ventana.
    contenido: { paddingHorizontal: 0, paddingTop: 0 },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
    },
    omitir: {
      minHeight: tema.toqueMinimo,
      minWidth: tema.toqueMinimo,
      paddingHorizontal: tema.espaciado.s,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lista: { flex: 1 },
    pie: {
      paddingHorizontal: tema.espaciado.xxl,
      gap: tema.espaciado.xl,
    },
    acciones: { flexDirection: 'row', alignItems: 'center' },
    ranuraAtras: { overflow: 'hidden' },
    atras: {
      width: LADO_ATRAS,
      height: LADO_ATRAS,
      borderRadius: tema.radios.boton,
      borderWidth: 1.5,
      borderColor: tema.colores.bordeMarca,
      alignItems: 'center',
      justifyContent: 'center',
    },
    principal: { flex: 1 },
  });

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

const claveDePagina = (pagina: IPaginaOnboarding) => pagina.clave;

/**
 * Bienvenida de 4 páginas (O1–O4) la primera vez que se abre la app, según el lienzo aprobado, con
 * el movimiento de F1-04: fondo de marca cuyo halo sigue al scroll, parallax por página, indicador
 * interpolado, botón atrás que aparece al deslizar, «Siguiente» → «Comenzar» con fundido y la
 * entrada escalonada de O1.
 */
export function OnboardingScreen() {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const { width: ancho } = useWindowDimensions();
  const onboarding = useOnboardingController();
  const { indice, total, esUltima, _siguiente, _anterior, _alDesplazar } =
    onboarding;
  const listaRef = useRef<FlatList<IPaginaOnboarding>>(null);
  const omitir = usePresionEscala();
  const atras = usePresionEscala(0.92);

  // Desplazamiento horizontal compartido con el hilo de UI: todo lo animado se deriva de él.
  const scrollX = useSharedValue(0);
  const alDesplazar = useAnimatedScrollHandler({
    onScroll: e => {
      scrollX.value = e.contentOffset.x;
    },
  });
  const progreso = useDerivedValue(() =>
    ancho > 0 ? scrollX.value / ancho : 0,
  );

  // «Siguiente» y atrás cambian el índice; la lista lo sigue. Con un ancho nuevo se recoloca (R4).
  useEffect(() => {
    listaRef.current?.scrollToIndex({ index: indice, animated: true });
  }, [indice, ancho]);

  // Atrás de Android vuelve a la página anterior; en O1 no se intercepta y sale de la app (CA12).
  useFocusEffect(
    useCallback(() => {
      const suscripcion = BackHandler.addEventListener(
        'hardwareBackPress',
        _anterior,
      );
      return () => suscripcion.remove();
    }, [_anterior]),
  );

  const alTerminarDesplazamiento = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      _alDesplazar(e.nativeEvent.contentOffset.x, ancho);
    },
    [_alDesplazar, ancho],
  );

  const disposicion = useCallback(
    (_: ArrayLike<IPaginaOnboarding> | null | undefined, i: number) => ({
      length: ancho,
      offset: ancho * i,
      index: i,
    }),
    [ancho],
  );

  const pintarPagina: ListRenderItem<IPaginaOnboarding> = useCallback(
    ({ item, index }) => (
      <PaginaOnboarding
        pagina={item}
        indicePagina={index}
        ancho={ancho}
        activa={index === indice}
        progreso={progreso}
      />
    ),
    [ancho, indice, progreso],
  );

  const separacionAtras = tema.espaciado.m;
  // backReveal: la ranura del botón atrás crece con el scroll de O1 a O2.
  const estiloRanuraAtras = useAnimatedStyle(() => {
    const r = interpolate(progreso.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      width: interpolate(r, [0, 1], [0, LADO_ATRAS]),
      marginRight: interpolate(r, [0, 1], [0, separacionAtras]),
      opacity: interpolate(r, [0, 0.4, 1], [0, 0.55, 1]),
    };
  });
  const estiloBotonAtras = useAnimatedStyle(() => {
    const r = interpolate(progreso.value, [0, 1], [0, 1], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: interpolate(r, [0, 1], [-LADO_ATRAS * 0.55, 0]) },
        { scale: interpolate(r, [0, 1], [0.72, 1]) },
      ],
    };
  });

  const enPrimera = indice === 0;
  return (
    <Pantalla style={estilos.contenido}>
      <FondoMarca progreso={progreso} total={total} alturaHalo={0.38} />
      <View style={estilos.cabecera}>
        <Revelar retraso={RETRASO_LOGO}>
          <LogoMarca
            tamano={34}
            categoria={categoriaIsotipoPorModo(tema.modo)}
          />
        </Revelar>
        <PressableAnimado
          accessibilityRole="button"
          accessibilityLabel={textosOnboarding.omitirEtiqueta}
          onPress={onboarding._terminar}
          onPressIn={omitir.alPresionar}
          onPressOut={omitir.alSoltar}
          style={[estilos.omitir, omitir.estiloEscala]}
        >
          <Texto variante="cuerpoFuerte" color="textoSecundario">
            {textosOnboarding.omitir}
          </Texto>
        </PressableAnimado>
      </View>
      <Animated.FlatList
        ref={listaRef}
        testID="lista-onboarding"
        style={estilos.lista}
        data={PAGINAS_ONBOARDING}
        extraData={indice}
        keyExtractor={claveDePagina}
        renderItem={pintarPagina}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={disposicion}
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        onMomentumScrollEnd={alTerminarDesplazamiento}
      />
      <Revelar retraso={RETRASO_PIE} style={estilos.pie}>
        <IndicadorPaginas indice={indice} total={total} progreso={progreso} />
        <View style={estilos.acciones}>
          <Animated.View
            style={[estilos.ranuraAtras, estiloRanuraAtras]}
            pointerEvents={enPrimera ? 'none' : 'auto'}
            accessibilityElementsHidden={enPrimera}
            importantForAccessibility={
              enPrimera ? 'no-hide-descendants' : 'auto'
            }
          >
            <Animated.View style={[estiloBotonAtras, atras.estiloEscala]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={textosOnboarding.anteriorEtiqueta}
                disabled={enPrimera}
                onPress={_anterior}
                onPressIn={atras.alPresionar}
                onPressOut={atras.alSoltar}
                style={estilos.atras}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 12H5m6-6-6 6 6 6"
                    stroke={tema.colores.marca}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Pressable>
            </Animated.View>
          </Animated.View>
          {/* La clave cambia con el texto: el botón nuevo entra con un fundido cruzado. */}
          <Animated.View
            key={esUltima ? 'comenzar' : 'siguiente'}
            entering={FadeIn.duration(duraciones.fundidoCorto)}
            style={estilos.principal}
          >
            <Boton
              titulo={
                esUltima
                  ? textosOnboarding.comenzar
                  : textosOnboarding.siguiente
              }
              onPress={_siguiente}
            />
          </Animated.View>
        </View>
      </Revelar>
    </Pantalla>
  );
}
