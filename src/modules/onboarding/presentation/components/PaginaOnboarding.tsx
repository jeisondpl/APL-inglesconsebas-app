import { StyleSheet, View } from 'react-native';

import { Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import type { IPaginaOnboarding } from '../onboarding.config';

/** Ancho máximo de la descripción (lienzo: 300). */
const ANCHO_DESCRIPCION = 300;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pagina: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxxl,
    },
    titulo: { marginTop: tema.espaciado.xxxl, textAlign: 'center' },
    descripcion: {
      marginTop: tema.espaciado.m,
      maxWidth: ANCHO_DESCRIPCION,
      textAlign: 'center',
    },
  });

export interface IPropsPaginaOnboarding {
  pagina: IPaginaOnboarding;
  /** Ancho de la página (el de la ventana): cada página ocupa la pantalla. */
  ancho: number;
  /** Las páginas fuera de pantalla quedan ocultas al lector (CA14). */
  activa: boolean;
}

/** Una página de la bienvenida: ilustración, título y descripción. */
export function PaginaOnboarding({
  pagina,
  ancho,
  activa,
}: IPropsPaginaOnboarding) {
  const estilos = useEstilos(crearEstilos);
  const { Ilustracion } = pagina;
  return (
    <View
      testID={`pagina-${pagina.clave}`}
      style={[estilos.pagina, { width: ancho }]}
      accessibilityElementsHidden={!activa}
      importantForAccessibility={activa ? 'auto' : 'no-hide-descendants'}
    >
      <Ilustracion />
      <Texto variante="h1" accessibilityRole="header" style={estilos.titulo}>
        {pagina.titulo}
      </Texto>
      <Texto color="textoSecundario" style={estilos.descripcion}>
        {pagina.descripcion}
      </Texto>
    </View>
  );
}
