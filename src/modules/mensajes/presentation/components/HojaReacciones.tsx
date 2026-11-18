import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/shared/components/Texto';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import type { IMensajeChat } from '../../domain/entities/Mensajes.entities';
import { EMOJIS_REACCION } from '../../domain/validations/mensajes.validations';
import { textosMensajes as textos } from '../mensajes.textos';

export interface IPropsHojaReacciones {
  /** Mensaje al que se reacciona; null = hoja cerrada. */
  mensaje: IMensajeChat | null;
  /** Cómo figuro en las reacciones: marca la mía. */
  miReactor: string;
  alElegir: (emoji: string) => void;
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
    fila: { flexDirection: 'row', justifyContent: 'space-between' },
    emoji: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.superficieAlterna,
    },
    emojiMio: {
      borderWidth: 2,
      borderColor: tema.colores.marca,
    },
  });

/** Hoja inferior con los emojis a los que se puede reaccionar. Tocar el propio lo quita. */
export function HojaReacciones({
  mensaje,
  miReactor,
  alElegir,
  alCerrar,
}: IPropsHojaReacciones) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const mios = new Set(
    Object.entries(mensaje?.reacciones ?? {})
      .filter(([, quienes]) => quienes.includes(miReactor))
      .map(([emoji]) => emoji),
  );
  return (
    <Modal
      visible={mensaje !== null}
      transparent
      animationType="fade"
      onRequestClose={alCerrar}
      statusBarTranslucent
    >
      <View
        style={estilos.contenedor}
        testID="hoja-reacciones"
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
            {textos.reacciones.titulo}
          </Texto>
          <View style={estilos.fila}>
            {EMOJIS_REACCION.map(emoji => (
              <Pressable
                key={emoji}
                testID={`reaccion-${emoji}`}
                onPress={() => alElegir(emoji)}
                accessibilityRole="button"
                accessibilityLabel={textos.reacciones.ayuda(emoji)}
                style={[estilos.emoji, mios.has(emoji) && estilos.emojiMio]}
              >
                <Texto variante="h2">{emoji}</Texto>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
