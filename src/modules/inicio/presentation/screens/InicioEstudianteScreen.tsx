import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea } from '@/shared/components/AvisoEnLinea';
import {
  ESPACIO_BARRA_PESTANAS,
  PulsoCarga,
  Revelar,
  useOcultarBarraAlDesplazar,
} from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useInicioController } from '../../aplications/controllers/Inicio.controller';
import type { IVistaInicio } from '../../aplications/vistaInicio/vistaInicio';
import { CabeceraInicio } from '../components/CabeceraInicio';
import { HojaCuenta } from '../components/HojaCuenta';
import { SeccionMensajes, SeccionTareas } from '../components/SeccionesLista';
import { TarjetaProximaClase } from '../components/TarjetaProximaClase';
import {
  TarjetaCancelaciones,
  TarjetaCiclo,
} from '../components/TarjetasResumen';
import { textosInicio as textos } from '../inicio.textos';

/** Pestañas a las que lleva el inicio al tocar un bloque. */
export type DestinoInicio = 'clases' | 'mensajes' | 'tareas';

export interface IPropsInicioEstudianteScreen {
  /** Estudiante de la sesión (lo pasa la composición de `src/app`). */
  usuario: { id: string; nombre: string };
  /** Cierra la sesión con el caso de uso del módulo de sesión. */
  alCerrarSesion: () => Promise<void>;
  /** Abre el perfil (F1-03b). */
  alVerPerfil?: () => void;
  /** Abre el escaparate del sistema de diseño. Solo se usa en `__DEV__`. */
  alVerSistemaDiseno?: () => void;
  /** Cambia de pestaña (tareas, mensajes…). */
  alIrA?: (destino: DestinoInicio) => void;
  /** Avisa los no leídos para la insignia de la pestaña Mensajes. */
  alCambiarNoLeidos?: (cantidad: number) => void;
}

/** Escalonado de las entradas, en ms. */
const PASO_ENTRADA = 80;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      flexGrow: 1,
      paddingHorizontal: tema.espaciado.xl,
      paddingBottom: ESPACIO_BARRA_PESTANAS,
      gap: 13,
    },
    carga: { flex: 1, minHeight: 320 },
    fila: { flexDirection: 'row', gap: tema.espaciado.m },
  });

/**
 * Inicio del estudiante (A-M2, F1-05): saludo con plan y ciclo, próxima clase con cuenta atrás,
 * ciclo, cancelaciones, tareas pendientes y último mensaje. Todo sale de la API de Leap; lo que no
 * hay se dice tal cual («Aún no…»). Pull-to-refresh, entradas escalonadas y la barra de pestañas
 * que se oculta al desplazar.
 */
export function InicioEstudianteScreen({
  usuario,
  alCerrarSesion,
  alVerPerfil,
  alVerSistemaDiseno,
  alIrA,
  alCambiarNoLeidos,
}: IPropsInicioEstudianteScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const alDesplazar = useOcultarBarraAlDesplazar();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const { estado, ahoraMs, refrescando, _cargar, _refrescar, _abrirClase } =
    useInicioController({ idEstudiante: usuario.id, alCambiarNoLeidos });

  const vista = estado.tipo === 'listo' ? estado.vista : null;
  const subtitulo =
    vista?.plan.ok === true
      ? textos.planYCiclo(vista.plan.datos.nombre, vista.plan.datos.ciclo)
      : null;

  const avisoSeccion = (testID: string) => (
    <AvisoEnLinea
      testID={testID}
      tono="error"
      titulo={textos.error.seccion}
      accion={{ titulo: textos.error.reintentar, onPress: _refrescar }}
    />
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="inicio-estudiante"
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
          <CabeceraInicio
            nombre={usuario.nombre}
            subtitulo={subtitulo}
            alAbrirCuenta={() => setCuentaAbierta(true)}
          />
        </Revelar>

        {estado.tipo === 'cargando' ? (
          <View style={estilos.carga}>
            <PulsoCarga etiqueta={textos.cargando} tamano={56} />
          </View>
        ) : null}

        {estado.tipo === 'error' ? (
          <Revelar retraso={PASO_ENTRADA}>
            <AvisoEnLinea
              testID="inicio-error"
              tono="error"
              titulo={textos.error.titulo}
              mensaje={estado.msg}
              accion={{ titulo: textos.error.reintentar, onPress: _cargar }}
            />
          </Revelar>
        ) : null}

        {vista ? (
          <ContenidoInicio
            vista={vista}
            ahoraMs={ahoraMs}
            estilos={estilos}
            avisoSeccion={avisoSeccion}
            alIrAClase={_abrirClase}
            alReagendar={() => alIrA?.('clases')}
            alIrA={alIrA}
          />
        ) : null}
      </Animated.ScrollView>

      <HojaCuenta
        visible={cuentaAbierta}
        nombre={usuario.nombre}
        alCerrar={() => setCuentaAbierta(false)}
        alCerrarSesion={alCerrarSesion}
        alVerPerfil={
          alVerPerfil
            ? () => {
                setCuentaAbierta(false);
                alVerPerfil();
              }
            : undefined
        }
        alVerSistemaDiseno={
          __DEV__ && alVerSistemaDiseno
            ? () => {
                setCuentaAbierta(false);
                alVerSistemaDiseno();
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

function ContenidoInicio({
  vista,
  ahoraMs,
  estilos,
  avisoSeccion,
  alIrAClase,
  alReagendar,
  alIrA,
}: {
  vista: IVistaInicio;
  ahoraMs: number;
  estilos: ReturnType<typeof crearEstilos>;
  avisoSeccion: (testID: string) => React.ReactNode;
  alIrAClase: (enlace: string) => void;
  alReagendar: () => void;
  alIrA?: (destino: DestinoInicio) => void;
}) {
  const { proximaClase, ciclo, plan, tareas, mensajes } = vista;
  return (
    <>
      <Revelar retraso={PASO_ENTRADA}>
        {proximaClase.ok ? (
          <TarjetaProximaClase
            clase={proximaClase.datos.clase}
            cuentaAtras={proximaClase.datos.cuentaAtras}
            ahoraMs={ahoraMs}
            alIrAClase={alIrAClase}
            alReagendar={alReagendar}
          />
        ) : (
          avisoSeccion('error-proxima-clase')
        )}
      </Revelar>

      <Revelar retraso={PASO_ENTRADA * 2} style={estilos.fila}>
        {ciclo.ok ? <TarjetaCiclo progreso={ciclo.datos} /> : null}
        {plan.ok ? (
          <TarjetaCancelaciones cancelaciones={plan.datos.cancelaciones} />
        ) : null}
      </Revelar>
      {!ciclo.ok && !plan.ok ? (
        <Revelar retraso={PASO_ENTRADA * 2}>
          {avisoSeccion('error-ciclo')}
        </Revelar>
      ) : null}

      <Revelar retraso={PASO_ENTRADA * 3}>
        <SeccionTareas
          lista={tareas.ok ? tareas.datos.lista : []}
          total={tareas.ok ? tareas.datos.total : 0}
          ahoraMs={ahoraMs}
          alAbrir={() => alIrA?.('tareas')}
          aviso={tareas.ok ? undefined : avisoSeccion('error-tareas')}
        />
      </Revelar>

      <Revelar retraso={PASO_ENTRADA * 4}>
        <SeccionMensajes
          ultimo={mensajes.ok ? mensajes.datos.ultimo : null}
          noLeidos={mensajes.ok ? mensajes.datos.noLeidos : null}
          ahoraMs={ahoraMs}
          alAbrir={() => alIrA?.('mensajes')}
          aviso={mensajes.ok ? undefined : avisoSeccion('error-mensajes')}
        />
      </Revelar>
    </>
  );
}
