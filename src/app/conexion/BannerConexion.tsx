import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstadoConexion } from '@/app/di';
import { Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosConexion as textos } from './conexion.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      zIndex: 10,
      backgroundColor: tema.colores.superficie,
      borderBottomWidth: 1,
      borderBottomColor: tema.colores.borde,
      paddingHorizontal: tema.espaciado.xl,
      paddingBottom: tema.espaciado.s,
      gap: 2,
    },
  });

/**
 * Aviso «sin conexión» (F1-03b, 1.15): aparece cuando una petición no llega a Leap y se va solo en
 * cuanto llega una. Dice si lo que se ve es lo último que se guardó. No recibe toques.
 */
export function BannerConexion() {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const { sinConexion, mostrandoGuardado } = useEstadoConexion();
  if (!sinConexion) {
    return null;
  }
  return (
    <View
      testID="banner-sin-conexion"
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[estilos.banner, { paddingTop: insets.top + 6 }]}
    >
      <Texto variante="cuerpoFuerte">{textos.titulo}</Texto>
      <Texto variante="detalle" color="textoSecundario">
        {mostrandoGuardado ? textos.guardado : textos.sinGuardado}
      </Texto>
    </View>
  );
}
