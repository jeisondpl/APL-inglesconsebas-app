import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/shared/components/Boton';
import { Texto } from '@/shared/components/Texto';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import { textosInicio as textos } from '../inicio.textos';

export interface IPropsHojaCuenta {
  visible: boolean;
  nombre: string;
  alCerrar: () => void;
  alCerrarSesion: () => Promise<void>;
  /** Solo se pasa en desarrollo: abre el escaparate del sistema de diseño. */
  alVerSistemaDiseno?: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'flex-end' },
    velo: {
      ...StyleSheet.absoluteFill,
      backgroundColor: tema.colores.velo,
      opacity: OPACIDAD_VELO,
    },
    hoja: {
      backgroundColor: tema.colores.superficie,
      borderTopLeftRadius: tema.radios.heroe,
      borderTopRightRadius: tema.radios.heroe,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: tema.colores.borde,
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      gap: tema.espaciado.l,
    },
    asa: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.pista,
    },
  });

/**
 * Hoja inferior de la cuenta (patrón «Modal / bottom sheet» de la skill de marca): superficie con
 * radio superior 26, velo negro al 60 % y asa. «Cerrar sesión» y, en desarrollo, el escaparate.
 */
export function HojaCuenta({
  visible,
  nombre,
  alCerrar,
  alCerrarSesion,
  alVerSistemaDiseno,
}: IPropsHojaCuenta) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      await alCerrarSesion();
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducido ? 'none' : 'slide'}
      onRequestClose={alCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={estilos.contenedor}>
        <Pressable
          testID="velo-cuenta"
          style={estilos.velo}
          accessibilityRole="button"
          accessibilityLabel={textos.cuenta.cerrar}
          onPress={alCerrar}
        />
        <View
          testID="hoja-cuenta"
          accessibilityViewIsModal
          style={[estilos.hoja, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={estilos.asa} />
          <View>
            <Texto variante="etiqueta" color="textoSecundario">
              {textos.cuenta.titulo}
            </Texto>
            <Texto variante="h2" accessibilityRole="header">
              {nombre}
            </Texto>
          </View>
          {__DEV__ && alVerSistemaDiseno ? (
            <Boton
              variante="secundario"
              titulo={textos.cuenta.verSistemaDiseno}
              onPress={alVerSistemaDiseno}
            />
          ) : null}
          <Boton
            variante="peligro"
            titulo={textos.cuenta.cerrarSesion}
            onPress={cerrarSesion}
            cargando={cerrando}
          />
        </View>
      </View>
    </Modal>
  );
}
