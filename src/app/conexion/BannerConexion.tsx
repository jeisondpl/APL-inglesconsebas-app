import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstadoConexion } from '@/app/di';
import { Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosConexion as textos } from './conexion.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    columna: { flex: 1 },
    banner: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      zIndex: 10,
      elevation: 10,
      backgroundColor: tema.colores.superficie,
      borderBottomWidth: 1,
      borderBottomColor: tema.colores.borde,
      paddingHorizontal: tema.espaciado.xl,
      paddingBottom: tema.espaciado.xs,
    },
  });

interface IPropsBanner {
  alMedir?: (e: LayoutChangeEvent) => void;
}

/**
 * Aviso «sin conexión» (F1-03b, 1.15): aparece cuando una petición no llega a Leap y se va solo en
 * cuanto llega una. Dice si lo que se ve es lo último que se guardó. No recibe toques.
 */
export function BannerConexion({ alMedir }: IPropsBanner = {}) {
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
      onLayout={alMedir}
      style={[estilos.banner, { paddingTop: insets.top + 6 }]}
    >
      <Texto variante="detalle">
        {`${textos.titulo} · ${
          mostrandoGuardado ? textos.guardado : textos.sinGuardado
        }`}
      </Texto>
    </View>
  );
}

/**
 * La app con el aviso encima. El aviso flota (no mueve la navegación), pero mientras se ve la app
 * baja lo justo para no quedar tapada: su alto menos la barra de estado, que cada pantalla ya
 * reserva con su SafeAreaView. Antes tapaba la cabecera («Hola, Meli» en el moto g77).
 */
export function ConBannerConexion({ children }: { children: ReactNode }) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const { sinConexion } = useEstadoConexion();
  const [alto, setAlto] = useState(0);
  const desplazamiento = sinConexion ? Math.max(alto - insets.top, 0) : 0;
  return (
    <View style={estilos.columna}>
      <View
        testID="app-bajo-banner"
        style={[estilos.columna, { paddingTop: desplazamiento }]}
      >
        {children}
      </View>
      <BannerConexion alMedir={e => setAlto(e.nativeEvent.layout.height)} />
    </View>
  );
}
