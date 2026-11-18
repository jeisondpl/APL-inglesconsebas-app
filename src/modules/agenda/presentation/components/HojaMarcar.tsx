import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/shared/components/Boton';
import { Texto } from '@/shared/components/Texto';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import type { EstadoMarca } from '../../aplications/controllers/Agenda.controller';
import { textosAgenda as textos } from '../agenda.textos';

const t = textos.marcar.hoja;

export interface IPropsHojaMarcar {
  estado: EstadoMarca;
  alCerrar: () => void;
  alConfirmar: () => void;
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
      marginBottom: tema.espaciado.s,
    },
    acciones: { gap: tema.espaciado.m, marginTop: tema.espaciado.s },
  });

/**
 * Hoja inferior para confirmar «Realizada» o «No asistió». La marca no se puede cambiar desde la
 * App, así que se pide confirmación. Mientras se envía no se puede cerrar.
 */
export function HojaMarcar({
  estado,
  alCerrar,
  alConfirmar,
}: IPropsHojaMarcar) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const visible = estado.tipo === 'confirmar';
  const enviando = estado.tipo === 'confirmar' && estado.enviando;

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
          testID="velo-marcar"
          style={estilos.velo}
          accessibilityRole="button"
          accessibilityLabel={t.cerrar}
          onPress={alCerrar}
        />
        <View
          testID="hoja-marcar"
          accessibilityViewIsModal
          style={[estilos.hoja, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={estilos.asa} />
          {estado.tipo === 'confirmar' ? (
            <>
              <Texto variante="h2" accessibilityRole="header">
                {t.titulo(estado.marca)}
              </Texto>
              <Texto color="textoSecundario">
                {t.cuerpo(estado.clase, estado.marca)}
              </Texto>
              <Texto variante="detalle" color="textoSecundario">
                {t.aviso}
              </Texto>
              {estado.error ? (
                <Texto
                  variante="detalle"
                  color="peligro"
                  accessibilityRole="alert"
                  accessibilityLiveRegion="assertive"
                >
                  {estado.error}
                </Texto>
              ) : null}
              <View style={estilos.acciones}>
                <Boton
                  testID="marcar-confirmar"
                  variante={estado.marca === 'taken' ? 'primario' : 'peligro'}
                  titulo={t.confirmar(estado.marca)}
                  onPress={alConfirmar}
                  cargando={enviando}
                  deshabilitado={enviando}
                />
                <Boton
                  testID="marcar-volver"
                  variante="secundario"
                  titulo={t.volver}
                  onPress={alCerrar}
                  deshabilitado={enviando}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
