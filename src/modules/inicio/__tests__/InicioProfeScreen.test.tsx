// F1-07: pantalla de inicio del profe con el controller real y el repositorio en memoria.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { InicioProfeRepository } from '@/modules/inicio/domain/models/InicioProfeRepository';
import {
  crearMemoriaInicioProfeRepository,
  type IDatosMemoriaInicioProfe,
} from '@/modules/inicio/infrastructure/memoriaInicioProfeRepository';
import { InicioProfeScreen } from '@/modules/inicio/presentation/screens/InicioProfeScreen';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

// 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const PROFE = 't025ce0c8974fad25';

const DATOS: IDatosMemoriaInicioProfe = {
  clases: [
    {
      id: 'c1',
      idEstudiante: 's1',
      fecha: '2026-11-17',
      hora: '08:00',
      idProfe: PROFE,
      estado: 'taken',
      numeroClase: 2,
      enlaceZoom: null,
    },
    {
      id: 'c2',
      idEstudiante: 's2',
      fecha: '2026-11-17',
      hora: '09:30',
      idProfe: PROFE,
      estado: 'scheduled',
      numeroClase: 5,
      enlaceZoom: 'https://zoom.us/j/meli',
    },
    {
      id: 'c3',
      idEstudiante: 's1',
      fecha: '2026-11-17',
      hora: '18:00',
      idProfe: 'otra',
      estado: 'scheduled',
      numeroClase: 1,
      enlaceZoom: null,
    },
  ],
  estudiantes: [
    { id: 's1', nombre: 'Ana Torres' },
    { id: 's2', nombre: 'Luis Pérez' },
  ],
  asistencias: [
    {
      id: 'a1',
      estudiante: 'Sofía Ramírez',
      fecha: '2026-11-14',
      hora: '18:00',
    },
  ],
  tareas: [
    {
      id: 'r1',
      titulo: 'Email to a colleague',
      estudiante: 'Luis Pérez',
      estado: 'ready_review',
    },
    { id: 'r2', titulo: 'Pendiente', estudiante: 'Ana', estado: 'pending' },
  ],
  noLeidos: 2,
};

async function montar(
  opciones: {
    repo?: InicioProfeRepository;
    enlaces?: EnlacesPort;
    alIrA?: jest.Mock;
  } = {},
) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const dependencias = crearDependenciasDePrueba({
    estadoInicial: { tipo: 'sinSesion' },
    inicioProfe: opciones.repo ?? crearMemoriaInicioProfeRepository(DATOS),
    enlaces: opciones.enlaces,
  });
  const alCambiarNoLeidos = jest.fn();
  await render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          <InicioProfeScreen
            usuario={{ id: PROFE, nombre: 'Meli' }}
            alCerrarSesion={() => Promise.resolve()}
            alIrA={opciones.alIrA}
            alCambiarNoLeidos={alCambiarNoLeidos}
          />
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
  return { alCambiarNoLeidos };
}

afterEach(() => jest.restoreAllMocks());

describe('InicioProfeScreen (F1-07)', () => {
  it('saluda y muestra la fecha de hoy en Bogotá', async () => {
    await montar();
    expect(await screen.findByText('Hola, Meli')).toBeOnTheScreen();
    expect(screen.getByText('Profe · mar 17 nov')).toBeOnTheScreen();
  });

  it('destaca la clase en curso con su Zoom y lista solo las clases de hoy del profe', async () => {
    const enlaces = { abrir: jest.fn(() => Promise.resolve(true)) };
    await montar({ enlaces });
    expect(await screen.findByText('Clase en curso')).toBeOnTheScreen();
    expect(screen.getByText('2 clases')).toBeOnTheScreen();
    expect(screen.getByTestId('clase-hoy-c1')).toBeOnTheScreen();
    expect(screen.getByTestId('clase-hoy-c2')).toBeOnTheScreen();
    expect(screen.queryByTestId('clase-hoy-c3')).toBeNull();
    expect(
      screen.getByLabelText('8:00 a. m., Ana Torres, Clase 2, Realizada'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir Zoom' }));
    expect(enlaces.abrir).toHaveBeenCalledWith('https://zoom.us/j/meli');
  });

  it('asistencias por marcar: «Marcar» lleva a la pestaña Clases (agenda del profe)', async () => {
    const alIrA = jest.fn();
    await montar({ alIrA });
    expect(await screen.findByText('Sofía Ramírez')).toBeOnTheScreen();
    expect(screen.getByText('1 sin marcar')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Marcar la asistencia de Sofía Ramírez',
      }),
    );
    expect(alIrA).toHaveBeenLastCalledWith('clases');
  });

  it('tareas por revisar y mensajes llevan a sus pestañas; avisa los no leídos', async () => {
    const alIrA = jest.fn();
    const { alCambiarNoLeidos } = await montar({ alIrA });
    expect(await screen.findByText('1 por revisar')).toBeOnTheScreen();
    expect(screen.queryByText('Pendiente')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Revisar Email to a colleague, de Luis Pérez',
      }),
    );
    expect(alIrA).toHaveBeenLastCalledWith('tareas');
    expect(screen.getByText('2 mensajes sin leer')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('mensajes-profe'));
    expect(alIrA).toHaveBeenLastCalledWith('mensajes');
    expect(alCambiarNoLeidos).toHaveBeenCalledWith(2);
  });

  it('sin datos: estados vacíos honestos, sin clase destacada', async () => {
    await montar({ repo: crearMemoriaInicioProfeRepository() });
    expect(
      await screen.findByText('Hoy no tienes clases programadas.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Tienes todas las asistencias al día.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('No tienes tareas esperando revisión.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('No tienes mensajes sin leer.')).toBeOnTheScreen();
    expect(screen.queryByTestId('clase-destacada')).toBeNull();
  });

  it('si todo falla: error con «Reintentar»; si falla una sección, solo esa', async () => {
    const falla = () =>
      Promise.resolve(respuestaError<never>('Sin conexión', 0));
    await montar({
      repo: {
        listarClases: falla,
        listarEstudiantes: falla,
        listarAsistenciasPendientes: falla,
        listarTareas: falla,
        contarNoLeidos: falla,
      },
    });
    expect(await screen.findByTestId('inicio-profe-error')).toBeOnTheScreen();
    expect(screen.getByText('Sin conexión')).toBeOnTheScreen();
  });

  it('una sección caída muestra su aviso y el resto se pinta', async () => {
    const falla = () => Promise.resolve(respuestaError<never>('boom', 500));
    await montar({
      repo: {
        ...crearMemoriaInicioProfeRepository(DATOS),
        listarTareas: falla,
      },
    });
    expect(await screen.findByTestId('error-revisar')).toBeOnTheScreen();
    expect(screen.getByText('Clase en curso')).toBeOnTheScreen();
  });
});
