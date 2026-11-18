import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/shared/components/Boton';
import { Texto } from '@/shared/components/Texto';
import { fechaConDia } from '@/shared/lib/fechas';
import { PulsoCarga } from '@/shared/movimiento';
import { OPACIDAD_VELO, useEstilos, type ITema } from '@/shared/theme';

import type { EstadoReagendacion } from '../../aplications/controllers/Clases.controller';
import type { IEspacioReagendar } from '../../domain/entities/Clases.entities';
import { espaciosPorDia } from '../../domain/validations/clases.validations';
import { textosClases as textos } from '../clases.textos';

const t = textos.reagendar;

export interface IPropsHojaReagendar {
  estado: EstadoReagendacion;
  alCerrar: () => void;
  alElegir: (espacio: IEspacioReagendar) => void;
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
      maxHeight: '90%',
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
    dia: { gap: tema.espaciado.s },
    horas: { flexDirection: 'row', flexWrap: 'wrap', gap: tema.espaciado.s },
    hora: { flexGrow: 1, minWidth: '45%' },
    acciones: { gap: tema.espaciado.m, marginTop: tema.espaciado.s },
  });

/**
 * Hoja inferior para escoger el nuevo espacio de una clase «por reagendar» (F2-01, 2.3). Los
 * espacios ya vienen filtrados por Leap; aquí solo se escoge uno y se confirma. Mientras se envía no
 * se puede cerrar.
 */
export function HojaReagendar({
  estado,
  alCerrar,
  alElegir,
  alConfirmar,
}: IPropsHojaReagendar) {
  const estilos = useEstilos(crearEstilos);
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const visible = estado.tipo !== 'cerrada';
  const lista = estado.tipo === 'lista' ? estado : null;
  const datos = lista?.datos ?? null;

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
          testID="velo-reagendar"
          style={estilos.velo}
          accessibilityRole="button"
          accessibilityLabel={t.cerrar}
          onPress={alCerrar}
        />
        <View
          testID="hoja-reagendar"
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

            {datos && !datos.puede ? (
              <>
                <Texto variante="h2" accessibilityRole="header">
                  {t.noSePuede}
                </Texto>
                <Texto color="textoSecundario">{t.motivo(datos.motivo)}</Texto>
                <Boton
                  testID="reagendar-entendido"
                  titulo={t.entendido}
                  onPress={alCerrar}
                />
              </>
            ) : null}

            {lista && datos && datos.puede ? (
              <>
                <Texto variante="h2" accessibilityRole="header">
                  {t.titulo}
                </Texto>
                <Texto color="textoSecundario">{t.plazo(datos.hasta)}</Texto>
                <Texto variante="detalle" color="textoSecundario">
                  {t.regla(datos.anticipacionHoras)}
                </Texto>
                {lista.error ? (
                  <Texto
                    variante="detalle"
                    color="peligro"
                    accessibilityRole="alert"
                    accessibilityLiveRegion="assertive"
                  >
                    {lista.error}
                  </Texto>
                ) : null}

                {datos.espacios.length === 0 ? (
                  <Texto testID="reagendar-vacio" color="aviso">
                    {t.vacio}
                  </Texto>
                ) : (
                  espaciosPorDia(datos.espacios).map(dia => (
                    <View
                      key={dia.fecha}
                      style={estilos.dia}
                      testID={`dia-${dia.fecha}`}
                    >
                      <Texto variante="cuerpoFuerte">
                        {fechaConDia(dia.fecha)}
                      </Texto>
                      <View style={estilos.horas}>
                        {dia.espacios.map(e => {
                          const elegido =
                            lista.elegido?.fecha === e.fecha &&
                            lista.elegido.hora === e.hora &&
                            lista.elegido.idProfe === e.idProfe;
                          return (
                            <Boton
                              key={`${e.hora}-${e.idProfe}`}
                              testID={`espacio-${e.fecha}-${e.hora}-${e.idProfe}`}
                              variante={elegido ? 'primario' : 'secundario'}
                              titulo={t.conProfe(e.hora, e.profe)}
                              onPress={() => alElegir(e)}
                              deshabilitado={lista.enviando}
                              style={estilos.hora}
                            />
                          );
                        })}
                      </View>
                    </View>
                  ))
                )}

                <View style={estilos.acciones}>
                  {lista.elegido ? (
                    <Texto
                      variante="detalle"
                      color="textoSecundario"
                      testID="reagendar-elegido"
                    >
                      {t.confirmarElegido(
                        lista.elegido.fecha,
                        lista.elegido.hora,
                        lista.elegido.profe,
                      )}
                    </Texto>
                  ) : null}
                  <Boton
                    testID="reagendar-confirmar"
                    titulo={lista.elegido ? t.confirmar : t.elegirPrimero}
                    onPress={alConfirmar}
                    cargando={lista.enviando}
                    deshabilitado={!lista.elegido || lista.enviando}
                  />
                  <Boton
                    testID="reagendar-volver"
                    variante="secundario"
                    titulo={t.volver}
                    onPress={alCerrar}
                    deshabilitado={lista.enviando}
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
