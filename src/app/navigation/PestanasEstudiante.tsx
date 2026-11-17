import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PantallaProximamente } from '@/app/pestanas/PantallaProximamente';
import { textosPestanas as textos } from '@/app/pestanas/pestanas.textos';
import { InicioEstudianteScreen } from '@/modules/inicio/presentation/screens/InicioEstudianteScreen';
import { useSesionController } from '@/modules/sesion/aplications/controllers/Sesion.controller';
import {
  IconoClases,
  IconoInicio,
  IconoMensajes,
  IconoTareas,
} from '@/shared/iconos';
import {
  ProveedorBarraPestanas,
  useEstadoBarraPestanas,
} from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import { BarraPestanas, type IPestanaBarra } from './BarraPestanas';
import {
  ProveedorPestanas,
  usePestanas,
  type PestanaEstudiante,
} from './ContextoPestanas';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    raiz: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: { flex: 1 },
  });

/** Inicio con los datos de la sesión y las acciones que la pantalla del módulo no puede importar. */
function PestanaInicio({
  alCambiarNoLeidos,
}: {
  alCambiarNoLeidos: (n: number) => void;
}) {
  const navegacion = useNavigation();
  const { usuario, _cerrarSesion } = useSesionController();
  const { irAPestana } = usePestanas();
  if (!usuario) {
    return null;
  }
  return (
    <InicioEstudianteScreen
      usuario={usuario}
      alCerrarSesion={_cerrarSesion}
      alVerSistemaDiseno={
        __DEV__ ? () => navegacion.navigate('SistemaDiseno') : undefined
      }
      alIrA={irAPestana}
      alCambiarNoLeidos={alCambiarNoLeidos}
    />
  );
}

function Contenido({
  activa,
  alCambiarNoLeidos,
}: {
  activa: PestanaEstudiante;
  alCambiarNoLeidos: (n: number) => void;
}) {
  // Como Livic: solo se monta la pestaña activa.
  switch (activa) {
    case 'inicio':
      return <PestanaInicio alCambiarNoLeidos={alCambiarNoLeidos} />;
    case 'clases':
      return (
        <PantallaProximamente
          testID="pestana-contenido-clases"
          {...textos.pantallas.clases}
        />
      );
    case 'mensajes':
      return (
        <PantallaProximamente
          testID="pestana-contenido-mensajes"
          {...textos.pantallas.mensajes}
        />
      );
    case 'tareas':
      return (
        <PantallaProximamente
          testID="pestana-contenido-tareas"
          {...textos.pantallas.tareas}
        />
      );
  }
}

function Estructura() {
  const estilos = useEstilos(crearEstilos);
  const estadoBarra = useEstadoBarraPestanas();
  const [activa, setActiva] = useState<PestanaEstudiante>('inicio');
  const [noLeidos, setNoLeidos] = useState(0);

  const irAPestana = useCallback(
    (pestana: PestanaEstudiante) => {
      // Al cambiar de pestaña la barra vuelve a verse aunque se hubiera ocultado con el scroll.
      estadoBarra?.mostrar();
      setActiva(pestana);
    },
    [estadoBarra],
  );

  const pestanas = useMemo<IPestanaBarra<PestanaEstudiante>[]>(
    () => [
      { id: 'inicio', etiqueta: textos.inicio, Icono: IconoInicio },
      { id: 'clases', etiqueta: textos.clases, Icono: IconoClases },
      {
        id: 'mensajes',
        etiqueta: textos.mensajes,
        Icono: IconoMensajes,
        insignia: noLeidos,
        etiquetaInsignia: textos.sinLeer(noLeidos),
      },
      { id: 'tareas', etiqueta: textos.tareas, Icono: IconoTareas },
    ],
    [noLeidos],
  );

  return (
    <ProveedorPestanas activa={activa} irAPestana={irAPestana}>
      <View style={estilos.raiz} testID="pestanas-estudiante">
        <View style={estilos.contenido}>
          <Contenido activa={activa} alCambiarNoLeidos={setNoLeidos} />
        </View>
        <BarraPestanas
          pestanas={pestanas}
          activa={activa}
          alCambiar={irAPestana}
        />
      </View>
    </ProveedorPestanas>
  );
}

/**
 * Inicio del estudiante con su barra de pestañas (F1-05, `MainTabs` de Livic): estado de la
 * pestaña activa + contexto, sin `@react-navigation/bottom-tabs`. La insignia de Mensajes usa los
 * no leídos que obtiene el inicio.
 */
export function PestanasEstudiante() {
  return (
    <ProveedorBarraPestanas>
      <Estructura />
    </ProveedorBarraPestanas>
  );
}
