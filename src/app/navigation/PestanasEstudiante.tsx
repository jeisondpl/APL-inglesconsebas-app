import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PantallaProximamente } from '@/app/pestanas/PantallaProximamente';
import { textosPestanas as textos } from '@/app/pestanas/pestanas.textos';
import { AgendaScreen } from '@/modules/agenda/presentation/screens/AgendaScreen';
import { ClasesScreen } from '@/modules/clases/presentation/screens/ClasesScreen';
import { InicioEstudianteScreen } from '@/modules/inicio/presentation/screens/InicioEstudianteScreen';
import { InicioProfeScreen } from '@/modules/inicio/presentation/screens/InicioProfeScreen';
import { MensajesScreen } from '@/modules/mensajes/presentation/screens/MensajesScreen';
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

/** Rol con pestañas: el estudiante (F1-05) y el profe (F1-07). */
export type RolPestanas = 'estudiante' | 'profe';

/** Inicio con los datos de la sesión y las acciones que la pantalla del módulo no puede importar. */
function PestanaInicio({
  rol,
  alCambiarNoLeidos,
}: {
  rol: RolPestanas;
  alCambiarNoLeidos: (n: number) => void;
}) {
  const navegacion = useNavigation();
  const { usuario, _cerrarSesion } = useSesionController();
  const { irAPestana } = usePestanas();
  if (!usuario) {
    return null;
  }
  const Inicio = rol === 'profe' ? InicioProfeScreen : InicioEstudianteScreen;
  return (
    <Inicio
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

/** Clases con el id de la sesión: el historial del estudiante o la agenda del profe. */
function PestanaClases({ rol }: { rol: RolPestanas }) {
  const { usuario } = useSesionController();
  if (!usuario) {
    return null;
  }
  return rol === 'profe' ? (
    <AgendaScreen usuario={usuario} />
  ) : (
    <ClasesScreen usuario={usuario} />
  );
}

/** Chat con el id y el nombre de la sesión: el hilo del estudiante o la bandeja del profe. */
function PestanaMensajes({
  rol,
  alCambiarNoLeidos,
}: {
  rol: RolPestanas;
  alCambiarNoLeidos: (n: number) => void;
}) {
  const { usuario } = useSesionController();
  if (!usuario) {
    return null;
  }
  return (
    <MensajesScreen
      usuario={usuario}
      rol={rol}
      alCambiarNoLeidos={alCambiarNoLeidos}
    />
  );
}

function Contenido({
  rol,
  activa,
  alCambiarNoLeidos,
}: {
  rol: RolPestanas;
  activa: PestanaEstudiante;
  alCambiarNoLeidos: (n: number) => void;
}) {
  const pantallas = rol === 'profe' ? textos.pantallasProfe : textos.pantallas;
  // Como Livic: solo se monta la pestaña activa.
  switch (activa) {
    case 'inicio':
      return <PestanaInicio rol={rol} alCambiarNoLeidos={alCambiarNoLeidos} />;
    case 'clases':
      return <PestanaClases rol={rol} />;
    case 'mensajes':
      return (
        <PestanaMensajes rol={rol} alCambiarNoLeidos={alCambiarNoLeidos} />
      );
    case 'tareas':
      return (
        <PantallaProximamente
          testID="pestana-contenido-tareas"
          {...pantallas.tareas}
        />
      );
  }
}

function Estructura({ rol }: { rol: RolPestanas }) {
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
      <View style={estilos.raiz} testID={`pestanas-${rol}`}>
        <View style={estilos.contenido}>
          <Contenido
            rol={rol}
            activa={activa}
            alCambiarNoLeidos={setNoLeidos}
          />
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
      <Estructura rol="estudiante" />
    </ProveedorBarraPestanas>
  );
}

/** Inicio del profe con las mismas cuatro pestañas (F1-07); Tareas, próximamente. */
export function PestanasProfe() {
  return (
    <ProveedorBarraPestanas>
      <Estructura rol="profe" />
    </ProveedorBarraPestanas>
  );
}
