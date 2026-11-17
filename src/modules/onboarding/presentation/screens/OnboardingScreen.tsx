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

import { Boton, LogoMarca, Pantalla, Texto } from '@/shared/components';
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
  });

const claveDePagina = (pagina: IPaginaOnboarding) => pagina.clave;

/** Bienvenida de 4 páginas (O1–O4) la primera vez que se abre la app, según el lienzo aprobado. */
export function OnboardingScreen() {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const { width: ancho } = useWindowDimensions();
  const onboarding = useOnboardingController();
  const { indice, total, esUltima, _siguiente, _anterior, _alDesplazar } =
    onboarding;
  const listaRef = useRef<FlatList<IPaginaOnboarding>>(null);

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
      <PaginaOnboarding pagina={item} ancho={ancho} activa={index === indice} />
    ),
    [ancho, indice],
  );

  return (
    <Pantalla style={estilos.contenido}>
      <View style={estilos.cabecera}>
        <LogoMarca tamano={34} categoria={categoriaIsotipoPorModo(tema.modo)} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textosOnboarding.omitirEtiqueta}
          onPress={onboarding._terminar}
          style={estilos.omitir}
        >
          <Texto variante="cuerpoFuerte" color="textoSecundario">
            {textosOnboarding.omitir}
          </Texto>
        </Pressable>
      </View>
      <FlatList
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
        onMomentumScrollEnd={alTerminarDesplazamiento}
      />
      <View style={estilos.pie}>
        <IndicadorPaginas indice={indice} total={total} />
        <Boton
          titulo={
            esUltima ? textosOnboarding.comenzar : textosOnboarding.siguiente
          }
          onPress={_siguiente}
        />
      </View>
    </Pantalla>
  );
}
