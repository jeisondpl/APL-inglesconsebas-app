import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMarca } from '@/shared/components/LogoMarca';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import {
  ESPACIO_BARRA_PESTANAS,
  Revelar,
  useOcultarBarraAlDesplazar,
} from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { textosPestanas } from './pestanas.textos';

export interface IPropsPantallaProximamente {
  titulo: string;
  mensaje: string;
  testID?: string;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      flexGrow: 1,
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: 18,
      paddingBottom: ESPACIO_BARRA_PESTANAS,
      gap: tema.espaciado.xxl,
    },
    vacio: {
      alignItems: 'center',
      gap: tema.espaciado.m,
      paddingVertical: tema.espaciado.xxxl,
    },
    centrado: { textAlign: 'center' },
  });

/**
 * Pestaña que aún no tiene contenido (F1-05): cabecera y estado vacío de marca (isotipo, título y
 * mensaje cercano) con las mismas entradas animadas del inicio.
 */
export function PantallaProximamente({
  titulo,
  mensaje,
  testID,
}: IPropsPantallaProximamente) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const alDesplazar = useOcultarBarraAlDesplazar();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID={testID}
    >
      <Animated.ScrollView
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        contentContainerStyle={estilos.contenido}
      >
        <Revelar>
          <Texto variante="h1" accessibilityRole="header">
            {titulo}
          </Texto>
        </Revelar>
        <Revelar retraso={80}>
          <Tarjeta>
            <View style={estilos.vacio}>
              <LogoMarca
                tamano={64}
                categoria={tema.modo === 'oscuro' ? 'kids' : 'corporate'}
              />
              <Texto variante="titulo" style={estilos.centrado}>
                {textosPestanas.proximamente}
              </Texto>
              <Texto
                variante="cuerpo"
                color="textoSecundario"
                style={estilos.centrado}
              >
                {mensaje}
              </Texto>
            </View>
          </Tarjeta>
        </Revelar>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
