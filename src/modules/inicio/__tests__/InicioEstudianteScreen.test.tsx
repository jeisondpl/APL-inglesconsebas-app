// F1-05: pantalla de inicio del estudiante (CA7, CA9-CA14): roles, etiquetas, estados y acciones.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { IDatosMemoriaInicio } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import type { InicioRepository } from '@/modules/inicio/domain/models/InicioRepository';
import { hoyBogota } from '@/modules/inicio/domain/validations/inicio.validations';
import {
  fechaConDia,
  fechaCorta,
  hora12,
  textosInicio,
} from '@/modules/inicio/presentation/inicio.textos';
import {
  InicioEstudianteScreen,
  type IPropsInicioEstudianteScreen,
} from '@/modules/inicio/presentation/screens/InicioEstudianteScreen';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const DIA = 24 * 60 * 60 * 1000;
const manana = hoyBogota(Date.now() + DIA);
const enUnaSemana = hoyBogota(Date.now() + 7 * DIA);
const hoy = hoyBogota(Date.now());

/** Datos con la forma de la API (como los del Docker local, con una clase futura). */
const DATOS: IDatosMemoriaInicio = {
  plan: {
    plan: 'Progress',
    ciclo: { inicio: '2026-11-15', fin: '2026-12-14' },
    cancelacionesUsadas: 1,
    cancelacionesMaximas: 3,
  },
  clases: [
    {
      id: '1',
      fecha: manana,
      hora: '18:00',
      estado: 'scheduled',
      cuentaComoTomada: false,
      inicioCiclo: hoyBogota(Date.now() - 2 * DIA),
      finCiclo: hoyBogota(Date.now() + 20 * DIA),
      fechaNueva: null,
      horaNueva: null,
      profe: 'Meli',
      enlaceZoom: 'https://us06web.zoom.us/j/00000000001',
    },
    {
      id: '2',
      fecha: hoyBogota(Date.now() - DIA),
      hora: '18:00',
      estado: 'taken',
      cuentaComoTomada: true,
      inicioCiclo: hoyBogota(Date.now() - 2 * DIA),
      finCiclo: hoyBogota(Date.now() + 20 * DIA),
      fechaNueva: null,
      horaNueva: null,
      profe: 'Meli',
      enlaceZoom: null,
    },
  ],
  horario: [
    {
      diaSemana:
        new Date(`${manana}T12:00:00Z`).getUTCDay() === 0
          ? 7
          : new Date(`${manana}T12:00:00Z`).getUTCDay(),
      hora: '18:00',
      duracionMin: 50,
    },
  ],
  tareas: [
    {
      id: 't1',
      titulo: 'Past Simple',
      estado: 'pending',
      venceEl: enUnaSemana,
    },
    { id: 't2', titulo: '', estado: 'pending', venceEl: null },
    { id: 't3', titulo: 'Hecha', estado: 'reviewed', venceEl: null },
  ],
  noLeidos: 2,
  mensajes: [
    {
      id: 'm1',
      remitente: 'Meli',
      deEstudiante: false,
      texto: 'Te dejé el link de la clase',
      adjunto: null,
      enviadoEl: `${hoy} 17:12:00`,
    },
  ],
};

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

async function montar(
  inicio: InicioRepository = crearMemoriaInicioRepository(DATOS),
  props: Partial<IPropsInicioEstudianteScreen> = {},
) {
  const enlaces = { abrir: jest.fn(() => Promise.resolve(true)) };
  const dependencias = crearDependenciasDePrueba({ inicio, enlaces });
  const completas: IPropsInicioEstudianteScreen = {
    usuario: { id: 's0000000000000a1', nombre: 'Ana Torres' },
    alCerrarSesion: jest.fn(() => Promise.resolve()),
    alVerSistemaDiseno: jest.fn(),
    alIrA: jest.fn(),
    alCambiarNoLeidos: jest.fn(),
    ...props,
  };
  await render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          <InicioEstudianteScreen {...completas} />
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );
  return { props: completas, enlaces };
}

describe('InicioEstudianteScreen', () => {
  it('cabecera: saludo como encabezado, plan con el ciclo y avatar (CA7)', async () => {
    await montar();
    expect(
      screen.getByRole('header', { name: 'Hola, Ana Torres' }),
    ).toBeOnTheScreen();
    expect(
      await screen.findByText('Plan Progress · ciclo 15 nov – 14 dic'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    ).toHaveTextContent('A');
  });

  it('mientras carga muestra PulsoCarga', async () => {
    const repo: InicioRepository = {
      ...crearMemoriaInicioRepository(),
      obtenerPlan: () => new Promise(() => {}),
    };
    await montar(repo);
    expect(
      screen.getByRole('progressbar', { name: 'Cargando tu inicio' }),
    ).toBeOnTheScreen();
  });

  it('próxima clase: cuenta atrás, cuándo, profe, duración y Zoom (CA9)', async () => {
    const { enlaces } = await montar();
    expect(await screen.findByText('Mañana · 6:00 p. m.')).toBeOnTheScreen();
    expect(screen.getByText('Con Meli · 50 min · por Zoom')).toBeOnTheScreen();
    expect(screen.getByTestId('cuenta-atras')).toHaveTextContent(
      /^En \d+ (h|días?|min)$/,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ir a mi clase' }),
    );
    expect(enlaces.abrir).toHaveBeenCalledWith(
      'https://us06web.zoom.us/j/00000000001',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reagendar' }));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', text1: 'Próximamente' }),
    );
  });

  it('sin enlace de Zoom no ofrece «Ir a mi clase» y lo explica', async () => {
    await montar(
      crearMemoriaInicioRepository({
        ...DATOS,
        clases: [{ ...DATOS.clases![0], enlaceZoom: null, profe: null }],
        horario: [],
      }),
    );
    expect(
      await screen.findByText(textosInicio.proximaClase.sinEnlace),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Ir a mi clase' })).toBeNull();
    expect(screen.queryByText(/por Zoom/)).toBeNull();
  });

  it('una clase reagendada lo indica', async () => {
    await montar(
      crearMemoriaInicioRepository({
        ...DATOS,
        clases: [
          {
            ...DATOS.clases![0],
            estado: 'rescheduled',
            fecha: '2026-01-01',
            fechaNueva: manana,
            horaNueva: '09:30',
          },
        ],
      }),
    );
    expect(await screen.findByText('Mañana · 9:30 a. m.')).toBeOnTheScreen();
    expect(screen.getByText(/^Reagendada · Con Meli/)).toBeOnTheScreen();
  });

  it('ciclo con barra de progreso y cancelaciones con la antelación (CA10)', async () => {
    await montar();
    expect(await screen.findByText('1 de 12 clases')).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', {
        name: 'Ciclo: 1 de 12 clases tomadas',
      }),
    ).toHaveAccessibilityValue({ min: 0, max: 12, now: 1 });
    expect(screen.getByText('2 de 3')).toBeOnTheScreen();
    expect(screen.getByText('Avisa con 12 h de antelación')).toBeOnTheScreen();
  });

  it('tareas pendientes y mensajes llevan a su pestaña (CA11, CA12)', async () => {
    const { props } = await montar();
    expect(await screen.findByText('2 por entregar')).toBeOnTheScreen();
    expect(screen.getByText('Past Simple')).toBeOnTheScreen();
    expect(
      screen.getByText(`Vence ${fechaConDia(enUnaSemana)}`),
    ).toBeOnTheScreen();
    expect(screen.getByText(textosInicio.tareas.sinTitulo)).toBeOnTheScreen();
    expect(screen.queryByText('Hecha')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: /^Tarea: Past Simple/ }),
    );
    expect(props.alIrA).toHaveBeenCalledWith('tareas');

    expect(screen.getByText('2 sin leer')).toBeOnTheScreen();
    expect(screen.getByText('Te dejé el link de la clase')).toBeOnTheScreen();
    expect(screen.getByText('5:12 p. m.')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Último mensaje de Meli, 2 sin leer',
      }),
    );
    expect(props.alIrA).toHaveBeenCalledWith('mensajes');
    expect(props.alCambiarNoLeidos).toHaveBeenCalledWith(2);
  });

  it('sin datos muestra vacíos honestos, nunca datos de ejemplo (CA15)', async () => {
    await montar(crearMemoriaInicioRepository());
    expect(
      await screen.findByText('Aún no tienes clases programadas'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Aún no tienes tareas pendientes'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Aún no tienes mensajes')).toBeOnTheScreen();
    expect(
      screen.getByText('Tu plan no incluye cancelaciones'),
    ).toBeOnTheScreen();
    expect(screen.getByText('0 clases tomadas')).toBeOnTheScreen();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(/^Plan /)).toBeNull();
  });

  it('error total: alerta con «Reintentar» que vuelve a cargar (CA13)', async () => {
    const falla = () => Promise.resolve(respuestaError<never>('Sin red', 0));
    const repo: InicioRepository = {
      obtenerPlan: falla,
      listarClases: falla,
      listarHorario: falla,
      listarTareas: falla,
      contarNoLeidos: falla,
      listarMensajes: falla,
    };
    await montar(repo);
    expect(
      await screen.findByRole('alert', { name: /No pudimos cargar tu inicio/ }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Sin red')).toBeOnTheScreen();
    Object.assign(repo, crearMemoriaInicioRepository(DATOS));
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Mañana · 6:00 p. m.')).toBeOnTheScreen();
  });

  it('si falla una sección, solo esa muestra el aviso (CA13)', async () => {
    const falla = () => Promise.resolve(respuestaError<never>('caído', 500));
    await montar({
      ...crearMemoriaInicioRepository(DATOS),
      listarTareas: falla,
      listarMensajes: falla,
      listarClases: falla,
      obtenerPlan: falla,
    });
    expect(await screen.findByTestId('error-tareas')).toBeOnTheScreen();
    expect(screen.getByTestId('error-mensajes')).toBeOnTheScreen();
    expect(screen.getByTestId('error-proxima-clase')).toBeOnTheScreen();
    expect(screen.getByTestId('error-ciclo')).toBeOnTheScreen();
    expect(screen.queryByText('2 por entregar')).toBeNull();
    expect(
      screen.getAllByRole('button', { name: 'Reintentar' }).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('el avatar abre la hoja: cerrar sesión, escaparate y cerrar (CA7, CA8)', async () => {
    const { props } = await montar();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    expect(screen.getByTestId('hoja-cuenta')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ver sistema de diseño' }),
    );
    expect(props.alVerSistemaDiseno).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId('hoja-cuenta')).toBeNull());

    await fireEvent.press(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    expect(props.alCerrarSesion).toHaveBeenCalled();
  });

  it('tocar el velo cierra la hoja', async () => {
    await montar();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    // La hoja es modal para el lector de pantalla: el velo se toca, el lector usa «atrás».
    await fireEvent.press(
      screen.getByTestId('velo-cuenta', { includeHiddenElements: true }),
    );
    await waitFor(() => expect(screen.queryByTestId('hoja-cuenta')).toBeNull());
  });

  it('sin escaparate (producción) la hoja solo ofrece cerrar sesión', async () => {
    await montar(undefined, { alVerSistemaDiseno: undefined });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Ver sistema de diseño' }),
    ).toBeNull();
  });

  it('con reduce-motion se pinta igual (CA14)', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    await montar();
    expect(await screen.findByText('Mañana · 6:00 p. m.')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Abrir el menú de tu cuenta' }),
    );
    expect(screen.getByTestId('hoja-cuenta')).toBeOnTheScreen();
  });
});

describe('textosInicio', () => {
  it('formatos de hora y fecha', () => {
    expect(hora12('00:05')).toBe('12:05 a. m.');
    expect(hora12('12:00')).toBe('12:00 p. m.');
    expect(hora12('nada')).toBe('nada');
    expect(fechaCorta('2026-11-15')).toBe('15 nov');
    expect(fechaCorta('x')).toBe('x');
    expect(fechaConDia('2026-09-29')).toBe('mar 29 sep');
    expect(fechaConDia('x')).toBe('x');
  });

  it('cuenta atrás, cuándo y plan', () => {
    const t = textosInicio.proximaClase;
    expect(t.cuentaAtras({ tipo: 'ahora' })).toBe('Ahora');
    expect(t.cuentaAtras({ tipo: 'minutos', valor: 35 })).toBe('En 35 min');
    expect(t.cuentaAtras({ tipo: 'horas', valor: 21 })).toBe('En 21 h');
    expect(t.cuentaAtras({ tipo: 'dias', valor: 1 })).toBe('En 1 día');
    expect(t.cuentaAtras({ tipo: 'dias', valor: 3 })).toBe('En 3 días');
    const ahora = Date.UTC(2026, 10, 17, 15, 0);
    expect(t.cuando('2026-11-17', '18:00', ahora)).toBe('Hoy · 6:00 p. m.');
    expect(t.cuando('2026-11-24', '18:00', ahora)).toBe(
      'mar 24 nov · 6:00 p. m.',
    );
    expect(t.cuando('x', '18:00', ahora)).toBe('6:00 p. m.');
    expect(t.detalle(null, null, false)).toBeNull();
    expect(textosInicio.planYCiclo(null, null)).toBeNull();
    expect(
      textosInicio.planYCiclo(null, {
        inicio: '2026-11-15',
        fin: '2026-12-14',
      }),
    ).toBe('ciclo 15 nov – 14 dic');
  });

  it('ciclo, tareas y mensajes', () => {
    expect(
      textosInicio.ciclo.progreso({ tomadas: 1, total: null, fraccion: 0 }),
    ).toBe('1 clase tomada');
    expect(
      textosInicio.ciclo.accesible({ tomadas: 3, total: null, fraccion: 0 }),
    ).toBe('Ciclo: 3 clases tomadas');
    const vence = textosInicio.tareas.vence;
    expect(vence('2026-11-17', 'hoy')).toBe('Vence hoy');
    expect(vence('2026-09-29', 'vencida')).toBe('Venció mar 29 sep');
    expect(vence(null, null)).toBeNull();
    const m = textosInicio.mensajes;
    const base = {
      id: '1',
      remitente: '',
      deEstudiante: false,
      texto: '',
      adjunto: 'voz' as const,
      enviadoEl: '2026-11-10 08:00:00',
    };
    expect(m.remitente(base)).toBe('Inglés con Sebas');
    expect(m.remitente({ ...base, deEstudiante: true })).toBe('Tú');
    expect(m.contenido(base)).toBe('Nota de voz');
    expect(m.contenido({ ...base, adjunto: 'imagen' })).toBe('Imagen');
    expect(m.cuando(base.enviadoEl, Date.UTC(2026, 10, 17, 15))).toBe('10 nov');
    expect(m.cuando('', 0)).toBe('');
    expect(m.abrir('Meli', null)).toBe('Último mensaje de Meli');
  });
});
