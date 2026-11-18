import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea } from '@/shared/components/AvisoEnLinea';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import {
  ESPACIO_BARRA_PESTANAS,
  PulsoCarga,
  Revelar,
  useOcultarBarraAlDesplazar,
} from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useClasesController } from '../../aplications/controllers/Clases.controller';
import { HojaCancelacion } from '../components/HojaCancelacion';
import { HojaReagendar } from '../components/HojaReagendar';
import {
  ListaClases,
  ResumenCiclo,
  SelectorCiclo,
} from '../components/HistorialCiclo';
import { textosClases as textos } from '../clases.textos';

export interface IPropsClasesScreen {
  /** Estudiante de la sesión (lo pasa la composición de `src/app`). */
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
 * Clases del estudiante (F2-01, ítem 2.1): el historial del ciclo con el estado de cada clase, un
 * selector para ver los ciclos anteriores y la próxima clase destacada con su Zoom. Cancelar (2.2)
 * y escoger un nuevo espacio para lo «por reagendar» (2.3) los decide Leap.
 */
export function ClasesScreen({ usuario }: IPropsClasesScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const alDesplazar = useOcultarBarraAlDesplazar();
  const {
    estado,
    indice,
    refrescando,
    ahoraMs,
    cancelacion,
    reagendacion,
    _abrirReagendar,
    _cerrarReagendar,
    _elegirEspacio,
    _confirmarReagendar,
    _abrirCancelacion,
    _cerrarCancelacion,
    _confirmarCancelacion,
    _cargar,
    _refrescar,
    _verAnterior,
    _verSiguiente,
    _abrirClase,
  } = useClasesController({ idEstudiante: usuario.id });

  const ciclos = estado.tipo === 'listo' ? estado.ciclos : [];
  const ciclo = ciclos[indice] ?? null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="clases-estudiante"
    >
      <Animated.ScrollView
        onScroll={alDesplazar}
        scrollEventThrottle={16}
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={_refrescar}
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

        {estado.tipo === 'cargando' ? (
          <View style={estilos.carga}>
            <PulsoCarga etiqueta={textos.cargando} tamano={56} />
          </View>
        ) : null}

        {estado.tipo === 'error' ? (
          <Revelar retraso={PASO_ENTRADA}>
            <AvisoEnLinea
              testID="clases-error"
              tono="error"
              titulo={textos.error.titulo}
              mensaje={estado.msg}
              accion={{ titulo: textos.error.reintentar, onPress: _cargar }}
            />
          </Revelar>
        ) : null}

        {estado.tipo === 'listo' && !ciclo ? (
          <Revelar retraso={PASO_ENTRADA}>
            <Tarjeta variante="destacada" testID="clases-vacio">
              <Texto variante="titulo">{textos.vacio.titulo}</Texto>
              <Texto variante="detalle" color="textoSecundario">
                {textos.vacio.mensaje}
              </Texto>
            </Tarjeta>
          </Revelar>
        ) : null}

        {ciclo ? (
          <>
            <Revelar retraso={PASO_ENTRADA}>
              <SelectorCiclo
                ciclo={ciclo}
                posicion={indice}
                total={ciclos.length}
                alAnterior={_verAnterior}
                alSiguiente={_verSiguiente}
              />
            </Revelar>
            <Revelar retraso={PASO_ENTRADA * 2}>
              <ResumenCiclo ciclo={ciclo} />
            </Revelar>
            <Revelar retraso={PASO_ENTRADA * 3}>
              <ListaClases
                ciclo={ciclo}
                ahoraMs={ahoraMs}
                alAbrirZoom={_abrirClase}
                alCancelar={_abrirCancelacion}
                alReagendar={_abrirReagendar}
              />
            </Revelar>
          </>
        ) : null}
      </Animated.ScrollView>

      <HojaReagendar
        estado={reagendacion}
        alCerrar={_cerrarReagendar}
        alElegir={_elegirEspacio}
        alConfirmar={_confirmarReagendar}
      />
      <HojaCancelacion
        estado={cancelacion}
        alCerrar={_cerrarCancelacion}
        alConfirmar={_confirmarCancelacion}
      />
    </SafeAreaView>
  );
}
