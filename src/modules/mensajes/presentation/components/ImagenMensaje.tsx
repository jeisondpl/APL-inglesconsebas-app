import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/shared/components/Texto';
import { useEstilos, type ITema } from '@/shared/theme';

import { useMediaController } from '../../aplications/controllers/Media.controller';
import type { IMensajeChat } from '../../domain/entities/Mensajes.entities';
import { textosMensajes as textos } from '../mensajes.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    foto: {
      width: 220,
      height: 165,
      borderRadius: tema.radios.tarjeta - 6,
      backgroundColor: tema.colores.pista,
    },
    marcador: {
      width: 220,
      height: 165,
      borderRadius: tema.radios.tarjeta - 6,
      alignItems: 'center',
      justifyContent: 'center',
      padding: tema.espaciado.m,
      backgroundColor: tema.colores.pista,
    },
    centrado: { textAlign: 'center' },
    visor: { flex: 1, backgroundColor: tema.colores.velo },
    visorImagen: { flex: 1 },
    cerrar: {
      position: 'absolute',
      right: tema.espaciado.l,
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: tema.espaciado.l,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.superficie,
    },
  });

/**
 * Foto de un mensaje: la propia recién enviada sale del teléfono; las demás se piden a Leap al
 * mostrarse. Tocarla la abre a pantalla completa.
 */
export function ImagenMensaje({
  mensaje: m,
  alMantener,
}: {
  mensaje: IMensajeChat;
  alMantener?: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const [abierta, setAbierta] = useState(false);
  const local = m.imagenLocal;
  const c = useMediaController(m.id, !local && m.id > 0);
  const uri =
    local ?? (c.estado.tipo === 'listo' ? c.estado.media.imagen : null);

  if (!uri) {
    if (c.estado.tipo === 'error') {
      return (
        <Pressable
          testID={`imagen-reintentar-${m.id}`}
          accessibilityRole="button"
          accessibilityLabel={textos.imagen.reintentar}
          onPress={() => {
            c._reintentar();
          }}
          style={estilos.marcador}
        >
          <Texto
            variante="detalle"
            color="textoSecundario"
            style={estilos.centrado}
          >
            {textos.imagen.reintentar}
          </Texto>
        </Pressable>
      );
    }
    return (
      <View
        style={estilos.marcador}
        accessibilityLabel={textos.imagen.cargando}
        testID={`imagen-cargando-${m.id}`}
      >
        <Texto
          variante="detalle"
          color="textoSecundario"
          style={estilos.centrado}
        >
          {textos.imagen.cargando}
        </Texto>
      </View>
    );
  }

  return (
    <>
      <Pressable
        testID={`imagen-${m.id}`}
        accessibilityRole="imagebutton"
        accessibilityLabel={textos.imagen.abrir}
        onPress={() => setAbierta(true)}
        onLongPress={alMantener}
        delayLongPress={350}
      >
        <Image
          source={{ uri }}
          style={estilos.foto}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Pressable>
      <Modal
        visible={abierta}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierta(false)}
        statusBarTranslucent
      >
        <View
          style={estilos.visor}
          testID="visor-imagen"
          accessibilityViewIsModal
        >
          <Image
            source={{ uri }}
            style={estilos.visorImagen}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Pressable
            testID="visor-cerrar"
            accessibilityRole="button"
            accessibilityLabel={textos.imagen.cerrar}
            onPress={() => setAbierta(false)}
            style={[estilos.cerrar, { top: insets.top + 12 }]}
          >
            <Texto variante="cuerpoFuerte">{textos.imagen.cerrar}</Texto>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
