import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/shared/components/Texto';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import type { OrigenFoto } from '../../domain/entities/Mensajes.entities';
import { textosMensajes as textos } from '../mensajes.textos';

export interface IPropsHojaAdjuntar {
  visible: boolean;
  alElegir: (origen: OrigenFoto) => void;
  alCerrar: () => void;
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
      gap: tema.espaciado.m,
    },
    asa: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.pista,
    },
    opcion: {
      minHeight: 52,
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.l,
      borderRadius: tema.radios.tarjeta,
      backgroundColor: tema.colores.superficieAlterna,
    },
  });

/** Hoja inferior para enviar una foto: de la galería o con la cámara. */
export function HojaAdjuntar({
  visible,
  alElegir,
  alCerrar,
}: IPropsHojaAdjuntar) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={alCerrar}
      statusBarTranslucent
    >
      <View
        style={estilos.contenedor}
        testID="hoja-adjuntar"
        accessibilityViewIsModal
      >
        <Pressable
          style={estilos.velo}
          onPress={alCerrar}
          accessibilityRole="button"
          accessibilityLabel={textos.reacciones.cerrar}
        />
        <View style={[estilos.hoja, { paddingBottom: insets.bottom + 20 }]}>
          <View style={estilos.asa} />
          <Texto variante="titulo" accessibilityRole="header">
            {textos.adjuntar.titulo}
          </Texto>
          <Pressable
            testID="adjuntar-galeria"
            accessibilityRole="button"
            accessibilityLabel={textos.adjuntar.galeria}
            onPress={() => alElegir('galeria')}
            style={estilos.opcion}
          >
            <Texto variante="cuerpoFuerte">{textos.adjuntar.galeria}</Texto>
          </Pressable>
          <Pressable
            testID="adjuntar-camara"
            accessibilityRole="button"
            accessibilityLabel={textos.adjuntar.camara}
            onPress={() => alElegir('camara')}
            style={estilos.opcion}
          >
            <Texto variante="cuerpoFuerte">{textos.adjuntar.camara}</Texto>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
