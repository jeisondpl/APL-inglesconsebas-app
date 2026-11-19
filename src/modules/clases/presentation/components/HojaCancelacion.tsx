import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/shared/components/Boton';
import { Texto } from '@/shared/components/Texto';
import { PulsoCarga } from '@/shared/movimiento';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import type { EstadoCancelacion } from '../../aplications/controllers/Clases.controller';
import type { OpcionCancelacion } from '../../domain/entities/Clases.entities';
import { textosClases as textos } from '../clases.textos';

const t = textos.cancelar;

export interface IPropsHojaCancelacion {
  estado: EstadoCancelacion;
  alCerrar: () => void;
  /** `opcion` solo cuando Leap dejó elegir entre reagendar y soltar. */
  alConfirmar: (opcion?: OpcionCancelacion) => void;
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
      maxHeight: '85%',
      backgroundColor: tema.colores.superficie,
      borderTopLeftRadius: tema.radios.heroe,
      borderTopRightRadius: tema.radios.heroe,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: tema.colores.borde,
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
    },
    asa: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.pista,
      marginBottom: tema.espaciado.l,
    },
    cuerpo: { gap: tema.espaciado.m },
    carga: { height: 140 },
    opcion: { gap: tema.espaciado.xs },
    detalleOpcion: { textAlign: 'center' },
    acciones: { gap: tema.espaciado.m, marginTop: tema.espaciado.s },
  });

/**
 * Hoja inferior para cancelar una clase (F2-01, 2.2). Muestra lo que Leap dice que pasaría, deja
 * elegir si el servidor ofrece opciones y confirma. La App no calcula nada: el escenario, el
 * estado final y los tokens son de Leap. Mientras se envía no se puede cerrar.
 */
export function HojaCancelacion({
  estado,
  alCerrar,
  alConfirmar,
}: IPropsHojaCancelacion) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const visible = estado.tipo !== 'cerrada';
  const enviando = estado.tipo === 'lista' && estado.enviando;
  const vista = estado.tipo === 'lista' ? estado.vista : null;

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
          testID="velo-cancelacion"
          style={estilos.velo}
          accessibilityRole="button"
          accessibilityLabel={t.cerrar}
          onPress={alCerrar}
        />
        <View
          testID="hoja-cancelacion"
          accessibilityViewIsModal
          style={[estilos.hoja, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={estilos.asa} />
          <ScrollView contentContainerStyle={estilos.cuerpo}>
            {estado.tipo === 'cargando' ? (
              <View style={estilos.carga}>
                <PulsoCarga etiqueta={t.revisando} tamano={48} />
              </View>
            ) : null}

            {vista && !vista.puede ? (
              <>
                <Texto variante="h2" accessibilityRole="header">
                  {t.noSePuede}
                </Texto>
                <Texto color="textoSecundario">{t.motivo(vista.motivo)}</Texto>
                <Boton
                  testID="cancelacion-entendido"
                  titulo={t.entendido}
                  onPress={alCerrar}
                />
              </>
            ) : null}

            {vista && vista.puede && estado.tipo === 'lista' ? (
              <>
                <Texto variante="h2" accessibilityRole="header">
                  {t.escenario(vista).titulo}
                </Texto>
                <Texto color="textoSecundario">
                  {t.escenario(vista).cuerpo}
                </Texto>
                {vista.enGrupo ? (
                  <Texto variante="detalle" color="aviso">
                    {t.enGrupo}
                  </Texto>
                ) : null}
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
                  {vista.opciones.length > 0 ? (
                    vista.opciones.map(o => {
                      const texto = t.opcion(o.opcion, o.descuentaToken);
                      return (
                        <View key={o.opcion} style={estilos.opcion}>
                          <Boton
                            testID={`cancelacion-${o.opcion}`}
                            variante={
                              o.opcion === 'reagendar'
                                ? 'primario'
                                : 'secundario'
                            }
                            titulo={texto.titulo}
                            accessibilityHint={texto.detalle}
                            onPress={() => alConfirmar(o.opcion)}
                            cargando={enviando}
                            deshabilitado={enviando}
                          />
                          <Texto
                            variante="detalle"
                            color="textoSecundario"
                            style={estilos.detalleOpcion}
                          >
                            {texto.detalle}
                          </Texto>
                        </View>
                      );
                    })
                  ) : (
                    <Boton
                      testID="cancelacion-confirmar"
                      variante={
                        t.escenario(vista).tono === 'peligro'
                          ? 'peligro'
                          : 'primario'
                      }
                      titulo={t.escenario(vista).confirmar}
                      onPress={() => alConfirmar()}
                      cargando={enviando}
                      deshabilitado={enviando}
                    />
                  )}
                  <Boton
                    testID="cancelacion-volver"
                    variante="secundario"
                    titulo={t.volver}
                    onPress={alCerrar}
                    deshabilitado={enviando}
                  />
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
