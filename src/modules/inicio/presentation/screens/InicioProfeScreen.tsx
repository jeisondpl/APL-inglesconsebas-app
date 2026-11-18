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

import { useInicioProfeController } from '../../aplications/controllers/InicioProfe.controller';
import type { IVistaInicioProfe } from '../../aplications/vistaInicioProfe/vistaInicioProfe';
import { hoyBogota } from '../../domain/validations/inicio.validations';
import {
  SeccionAsistencias,
  SeccionClasesHoy,
  SeccionRevisar,
  TarjetaClaseDestacada,
  TarjetaMensajesProfe,
} from '../components/BloquesInicioProfe';
import { CabeceraInicio } from '../components/CabeceraInicio';
import { HojaCuenta } from '../components/HojaCuenta';
import { textosInicioProfe as textos } from '../inicioProfe.textos';
import type { DestinoInicio } from './InicioEstudianteScreen';

export interface IPropsInicioProfeScreen {
  /** Profe de la sesión (lo pasa la composición de `src/app`). */
  usuario: { id: string; nombre: string };
  alCerrarSesion: () => Promise<void>;
  /** Abre el perfil (F1-03b). */
  alVerPerfil?: () => void;
  /** Solo en `__DEV__`. */
  alVerSistemaDiseno?: () => void;
  alIrA?: (destino: DestinoInicio) => void;
  alCambiarNoLeidos?: (cantidad: number) => void;
}

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
  });

/**
 * Inicio del profe (F1-07, ítem 1.18): la clase en curso o la siguiente con su Zoom, la agenda de
 * hoy, las asistencias por marcar, las tareas por revisar y los mensajes sin leer. Mismo patrón que
 * el del estudiante: secciones independientes, pull-to-refresh y entradas escalonadas.
 */
export function InicioProfeScreen({
  usuario,
  alCerrarSesion,
  alVerPerfil,
  alVerSistemaDiseno,
  alIrA,
  alCambiarNoLeidos,
}: IPropsInicioProfeScreen) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const alDesplazar = useOcultarBarraAlDesplazar();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const { estado, ahoraMs, refrescando, _cargar, _refrescar, _abrirClase } =
    useInicioProfeController({ idProfe: usuario.id, alCambiarNoLeidos });

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
      testID="inicio-profe"
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
            subtitulo={textos.subtitulo(hoyBogota(ahoraMs))}
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
              testID="inicio-profe-error"
              tono="error"
              titulo={textos.error.titulo}
              mensaje={estado.msg}
              accion={{ titulo: textos.error.reintentar, onPress: _cargar }}
            />
          </Revelar>
        ) : null}

        {estado.tipo === 'listo' ? (
          <ContenidoInicioProfe
            vista={estado.vista}
            avisoSeccion={avisoSeccion}
            alAbrirZoom={_abrirClase}
            alMarcar={() => alIrA?.('clases')}
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

function ContenidoInicioProfe({
  vista,
  avisoSeccion,
  alAbrirZoom,
  alMarcar,
  alIrA,
}: {
  vista: IVistaInicioProfe;
  avisoSeccion: (testID: string) => React.ReactNode;
  alAbrirZoom: (enlace: string) => void;
  alMarcar: () => void;
  alIrA?: (destino: DestinoInicio) => void;
}) {
  const { hoy, asistencias, tareas } = vista;
  const destacada = hoy.ok ? hoy.datos.destacada : null;
  return (
    <>
      {destacada ? (
        <Revelar retraso={PASO_ENTRADA}>
          <TarjetaClaseDestacada clase={destacada} alAbrirZoom={alAbrirZoom} />
        </Revelar>
      ) : null}

      <Revelar retraso={PASO_ENTRADA * 2}>
        <SeccionClasesHoy
          clases={hoy.ok ? hoy.datos.clases : []}
          aviso={hoy.ok ? undefined : avisoSeccion('error-clases-hoy')}
        />
      </Revelar>

      <Revelar retraso={PASO_ENTRADA * 3}>
        <SeccionAsistencias
          lista={asistencias.ok ? asistencias.datos.lista : []}
          total={asistencias.ok ? asistencias.datos.total : 0}
          alMarcar={alMarcar}
          aviso={asistencias.ok ? undefined : avisoSeccion('error-asistencias')}
        />
      </Revelar>

      <Revelar retraso={PASO_ENTRADA * 4}>
        <SeccionRevisar
          lista={tareas.ok ? tareas.datos.lista : []}
          total={tareas.ok ? tareas.datos.total : 0}
          alAbrir={() => alIrA?.('tareas')}
          aviso={tareas.ok ? undefined : avisoSeccion('error-revisar')}
        />
      </Revelar>

      {vista.noLeidosOk ? (
        <Revelar retraso={PASO_ENTRADA * 5}>
          <TarjetaMensajesProfe
            noLeidos={vista.noLeidos}
            alAbrir={() => alIrA?.('mensajes')}
          />
        </Revelar>
      ) : null}
    </>
  );
}
