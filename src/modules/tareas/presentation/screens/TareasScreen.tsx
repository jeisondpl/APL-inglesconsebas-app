import { useEffect } from 'react';
import {
  BackHandler,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea, Texto } from '@/shared/components';
import { ESPACIO_BARRA_PESTANAS, PulsoCarga } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useTareasController } from '../../aplications/controllers/Tareas.controller';
import type { SeccionTareas } from '../../domain/entities/Tareas.entities';
import { TarjetaTarea } from '../components/ComponentesTareas';
import { SelectorSeccion } from '../components/SelectorSeccion';
import { textosTareas as textos } from '../tareas.textos';
import { DetalleTarea } from './DetalleTarea';

export interface IPropsTareasScreen {
  rol: 'estudiante' | 'profe';
  /** Avisa de lo que falta por hacer (pendientes del estudiante o entregas por revisar de la profe). */
  alCambiarPendientes?: (n: number) => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    encabezado: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: tema.espaciado.s,
      gap: 2,
    },
    lista: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.s,
      paddingBottom: ESPACIO_BARRA_PESTANAS,
      gap: tema.espaciado.m,
    },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    aviso: { paddingHorizontal: tema.espaciado.xl },
    vacio: { textAlign: 'center', paddingTop: tema.espaciado.xxxl },
  });

function textoVacio(seccion: SeccionTareas, rol: 'estudiante' | 'profe') {
  if (rol === 'profe') {
    if (seccion === 'porRevisar') {
      return textos.vacio.porRevisarProfe;
    }
    if (seccion === 'pendientes') {
      return textos.vacio.pendientesProfe;
    }
  }
  return textos.vacio[seccion];
}

/**
 * Pestaña Tareas (F3-02): lista por secciones y detalle. El estudiante ve y entrega las suyas (3.7,
 * 3.8) y lee el feedback (3.9); la profe ve las entregas de sus estudiantes y las revisa (3.10). El
 * atrás de Android cierra el detalle.
 */
export function TareasScreen({ rol, alCambiarPendientes }: IPropsTareasScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const c = useTareasController(rol);
  const { abierta, estado, _cerrar } = c;

  useEffect(() => {
    if (!abierta) {
      return undefined;
    }
    const s = BackHandler.addEventListener('hardwareBackPress', () => {
      _cerrar();
      return true;
    });
    return () => s.remove();
  }, [abierta, _cerrar]);

  useEffect(() => {
    if (estado.tipo === 'listo') {
      alCambiarPendientes?.(
        rol === 'profe' ? estado.lista.porRevisar : estado.lista.pendientes,
      );
    }
  }, [estado, rol, alCambiarPendientes]);

  if (abierta) {
    return (
      <DetalleTarea
        tarea={abierta}
        rol={rol}
        ahoraMs={c.ahoraMs}
        alVolver={c._cerrar}
        alCambio={c._refrescar}
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="tareas-lista"
    >
      <View style={estilos.encabezado}>
        <Texto variante="h1" accessibilityRole="header">
          {textos.titulo}
        </Texto>
        <Texto variante="detalle" color="textoSecundario">
          {rol === 'profe' ? textos.subtituloProfe : textos.subtituloEstudiante}
        </Texto>
      </View>

      {estado.tipo === 'cargando' ? (
        <View style={estilos.centro}>
          <PulsoCarga etiqueta={textos.cargando} tamano={56} />
        </View>
      ) : null}

      {estado.tipo === 'error' ? (
        <View style={estilos.aviso}>
          <AvisoEnLinea
            testID="tareas-error"
            tono="error"
            titulo={textos.error.titulo}
            mensaje={estado.msg}
            accion={{ titulo: textos.error.reintentar, onPress: c._cargar }}
          />
        </View>
      ) : null}

      {estado.tipo === 'listo' ? (
        <>
          <SelectorSeccion
            secciones={c.secciones}
            activa={c.seccion}
            conteo={c.conteo}
            alElegir={c._elegirSeccion}
          />
          <FlatList
            data={c.visibles}
            keyExtractor={t => String(t.id)}
            contentContainerStyle={estilos.lista}
            refreshControl={
              <RefreshControl
                refreshing={c.refrescando}
                onRefresh={c._refrescar}
                tintColor={tema.colores.marca}
                colors={[tema.colores.marca]}
                progressBackgroundColor={tema.colores.superficie}
              />
            }
            ListEmptyComponent={
              <Texto
                testID="tareas-vacio"
                color="textoSecundario"
                style={estilos.vacio}
              >
                {textoVacio(c.seccion, rol)}
              </Texto>
            }
            renderItem={({ item }) => (
              <TarjetaTarea
                tarea={item}
                rol={rol}
                ahoraMs={c.ahoraMs}
                alAbrir={() => c._abrir(item.id)}
              />
            )}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}
