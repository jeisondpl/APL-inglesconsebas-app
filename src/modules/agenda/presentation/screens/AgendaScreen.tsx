import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea } from '@/shared/components/AvisoEnLinea';
import { Texto } from '@/shared/components/Texto';
import {
  ESPACIO_BARRA_PESTANAS,
  PulsoCarga,
  Revelar,
  useOcultarBarraAlDesplazar,
} from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useAgendaController } from '../../aplications/controllers/Agenda.controller';
import { textosAgenda as textos } from '../agenda.textos';
import {
  ListaDia,
  ListaSemana,
  NavegadorFecha,
  SelectorVista,
  SinMarcarAnteriores,
} from '../components/ComponentesAgenda';
import { HojaMarcar } from '../components/HojaMarcar';

export interface IPropsAgendaScreen {
  /** Profe de la sesión (lo pasa la composición de `src/app`). */
  usuario: { id: string };
}

const PASO_ENTRADA = 80;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      flexGrow: 1,
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: ESPACIO_BARRA_PESTANAS,
      gap: 14,
    },
    carga: { flex: 1, minHeight: 320 },
  });

/**
 * Clases del profe (F2-02, ítems 2.5 y 2.6): su horario por día y por semana, las clases de días
 * anteriores que siguen sin marca, y marcar «Realizada» o «No asistió» con confirmación. Leap decide
 * el resultado de la marca.
 */
export function AgendaScreen({ usuario }: IPropsAgendaScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const alDesplazar = useOcultarBarraAlDesplazar();
  const c = useAgendaController({ idProfe: usuario.id });

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="agenda-profe"
    >
      <Animated.ScrollView
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={c.refrescando}
            onRefresh={c._refrescar}
            tintColor={tema.colores.marca}
            colors={[tema.colores.marca]}
            progressBackgroundColor={tema.colores.superficie}
          />
        }
      >
        <Revelar>
          <Texto variante="h1" accessibilityRole="header">
            {textos.titulo}
          </Texto>
        </Revelar>

        {c.estado.tipo === 'cargando' ? (
          <View style={estilos.carga}>
            <PulsoCarga etiqueta={textos.cargando} tamano={56} />
          </View>
        ) : null}

        {c.estado.tipo === 'error' ? (
          <Revelar retraso={PASO_ENTRADA}>
            <AvisoEnLinea
              testID="agenda-error"
              tono="error"
              titulo={textos.error.titulo}
              mensaje={c.estado.msg}
              accion={{ titulo: textos.error.reintentar, onPress: c._cargar }}
            />
          </Revelar>
        ) : null}

        {c.estado.tipo === 'listo' ? (
          <>
            <Revelar retraso={PASO_ENTRADA}>
              <SelectorVista vista={c.vista} alCambiar={c._cambiarVista} />
            </Revelar>
            <Revelar retraso={PASO_ENTRADA * 2}>
              <NavegadorFecha
                vista={c.vista}
                fecha={c.fecha}
                semana={c.semana}
                hoy={c.hoy}
                alAnterior={c._anterior}
                alSiguiente={c._siguiente}
                alIrAHoy={c._irAHoy}
              />
            </Revelar>
            <Revelar retraso={PASO_ENTRADA * 3}>
              {c.vista === 'dia' ? (
                <ListaDia
                  clases={c.delDia}
                  fecha={c.fecha}
                  hoy={c.hoy}
                  ahoraMs={c.ahoraMs}
                  alAbrirZoom={c._abrirZoom}
                  alMarcar={c._pedirMarca}
                />
              ) : (
                <ListaSemana dias={c.semana} alAbrirDia={c._irADia} />
              )}
            </Revelar>
            {c.vista === 'dia' ? (
              <SinMarcarAnteriores
                clases={c.anteriores}
                ahoraMs={c.ahoraMs}
                alMarcar={c._pedirMarca}
              />
            ) : null}
          </>
        ) : null}
      </Animated.ScrollView>

      <HojaMarcar
        estado={c.marca}
        alCerrar={c._cancelarMarca}
        alConfirmar={c._confirmarMarca}
      />
    </SafeAreaView>
  );
}
