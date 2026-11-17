import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Texto } from '@/shared/components';
import { Revelar } from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import type { IPaginaOnboarding } from '../onboarding.config';

/** Ancho máximo de la descripción (lienzo: 300). */
const ANCHO_DESCRIPCION = 300;
/** Recorrido del parallax de la ilustración (± dp). */
const PARALLAX_ILUSTRACION = 40;
/** Desfase del texto respecto a la página (fracción del ancho). */
const DESFASE_TEXTO = 0.18;
/** Retrasos de la entrada de O1 (plan F1-04): ilustración y título 250 ms, texto 380 ms. */
const RETRASO_TITULO = 250;
const RETRASO_TEXTO = 380;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pagina: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxxl,
    },
    centrado: { alignItems: 'center' },
    titulo: { marginTop: tema.espaciado.xxxl, textAlign: 'center' },
    descripcion: {
      marginTop: tema.espaciado.m,
      maxWidth: ANCHO_DESCRIPCION,
      textAlign: 'center',
    },
  });

export interface IPropsPaginaOnboarding {
  pagina: IPaginaOnboarding;
  /** Posición de la página en la lista (para el parallax). */
  indicePagina: number;
  /** Ancho de la página (el de la ventana): cada página ocupa la pantalla. */
  ancho: number;
  /** Las páginas fuera de pantalla quedan ocultas al lector (CA14). */
  activa: boolean;
  /** Página como fracción mientras se desliza (scrollX / ancho). */
  progreso?: SharedValue<number>;
}

/** Envuelve en `Revelar` solo la entrada de la primera página (O1). */
function Entrada({
  activa,
  retraso,
  children,
}: {
  activa: boolean;
  retraso: number;
  children: ReactNode;
}) {
  return activa ? (
    <Revelar retraso={retraso} style={estilosFijos.entrada}>
      {children}
    </Revelar>
  ) : (
    <>{children}</>
  );
}

const estilosFijos = StyleSheet.create({ entrada: { alignItems: 'center' } });

/**
 * Una página de la bienvenida: ilustración, título y descripción. Mientras se desliza, la
 * ilustración hace parallax (translateX ±40, escala 0.9 → 1 y opacidad) y el texto se desfasa.
 */
export function PaginaOnboarding({
  pagina,
  indicePagina,
  ancho,
  activa,
  progreso,
}: IPropsPaginaOnboarding) {
  const estilos = useEstilos(crearEstilos);
  const { Ilustracion } = pagina;
  const tramo = [indicePagina - 1, indicePagina, indicePagina + 1];

  const estiloIlustracion = useAnimatedStyle(() => {
    const p = progreso ? progreso.value : indicePagina;
    return {
      opacity: interpolate(p, tramo, [0.2, 1, 0.2], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(
            p,
            tramo,
            [PARALLAX_ILUSTRACION, 0, -PARALLAX_ILUSTRACION],
            Extrapolation.CLAMP,
          ),
        },
        { scale: interpolate(p, tramo, [0.9, 1, 0.9], Extrapolation.CLAMP) },
      ],
    };
  });

  const estiloTexto = useAnimatedStyle(() => {
    const p = progreso ? progreso.value : indicePagina;
    return {
      opacity: interpolate(p, tramo, [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(
            p,
            tramo,
            [ancho * DESFASE_TEXTO, 0, -ancho * DESFASE_TEXTO],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const esPrimera = indicePagina === 0;
  return (
    <View
      testID={`pagina-${pagina.clave}`}
      style={[estilos.pagina, { width: ancho }]}
      accessibilityElementsHidden={!activa}
      importantForAccessibility={activa ? 'auto' : 'no-hide-descendants'}
    >
      <Entrada activa={esPrimera} retraso={RETRASO_TITULO}>
        <Animated.View style={estiloIlustracion}>
          <Ilustracion />
        </Animated.View>
      </Entrada>
      <Animated.View style={[estilos.centrado, estiloTexto]}>
        <Entrada activa={esPrimera} retraso={RETRASO_TITULO}>
          <Texto
            variante="h1"
            accessibilityRole="header"
            style={estilos.titulo}
          >
            {pagina.titulo}
          </Texto>
        </Entrada>
        <Entrada activa={esPrimera} retraso={RETRASO_TEXTO}>
          <Texto color="textoSecundario" style={estilos.descripcion}>
            {pagina.descripcion}
          </Texto>
        </Entrada>
      </Animated.View>
    </View>
  );
}
