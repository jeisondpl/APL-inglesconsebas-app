// F2-01 (2.1): controller y pantalla de Clases con el repositorio en memoria.
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  INTERVALO_RELOJ_CLASES_MS,
  useClasesController,
} from '@/modules/clases/aplications/controllers/Clases.controller';
import { mensajesClases } from '@/modules/clases/domain/clases.mensajes';
import type {
  IResponseClase,
  VistaPreviaCancelacion,
} from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { ClasesScreen } from '@/modules/clases/presentation/screens/ClasesScreen';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

// 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const ACTUAL = { inicioCiclo: '2026-11-05', finCiclo: '2026-12-04' };
const ANTERIOR = { inicioCiclo: '2026-10-05', finCiclo: '2026-11-04' };

const clase = (cambios: Partial<IResponseClase>): IResponseClase => ({
  id: '1',
  fecha: '2026-11-18',
  hora: '18:00',
  estado: 'scheduled',
  cuentaComoTomada: false,
  numeroClase: 1,
  fechaNueva: null,
  horaNueva: null,
  profe: 'Meli',
  enlaceZoom: 'https://zoom.us/j/meli',
  ...ACTUAL,
  ...cambios,
});

const CLASES: IResponseClase[] = [
  clase({
    id: 'a1',
    fecha: '2026-11-10',
    estado: 'taken',
    cuentaComoTomada: true,
    numeroClase: 1,
  }),
  clase({ id: 'a2', fecha: '2026-11-18', numeroClase: 2 }),
  clase({
    id: 'a3',
    fecha: '2026-11-12',
    estado: 'rescheduled',
    fechaNueva: '2026-11-24',
    horaNueva: '15:00',
    numeroClase: 3,
  }),
  clase({
    id: 'p1',
    fecha: '2026-10-20',
    estado: 'no_show',
    numeroClase: 1,
    ...ANTERIOR,
  }),
];

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.useRealTimers());

describe('useClasesController', () => {
  async function montar(
    repo: ClasesRepository,
    enlaces: EnlacesPort = { abrir: jest.fn(() => Promise.resolve(true)) },
    ahora: () => number = () => AHORA,
  ) {
    const dependencias = crearDependenciasDePrueba({ clases: repo, enlaces });
    const r = await renderHook(
      () => useClasesController({ idEstudiante: 's1', ahora }),
      { wrapper: envoltorio(dependencias) },
    );
    return { ...r, enlaces };
  }

  it('abre en el ciclo actual y navega entre ciclos sin salirse de la lista', async () => {
    const { result } = await montar(crearMemoriaClasesRepository(CLASES));
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(result.current.indice).toBe(0);
    await act(async () => result.current._verAnterior());
    expect(result.current.indice).toBe(1);
    await act(async () => result.current._verAnterior());
    expect(result.current.indice).toBe(1);
    await act(async () => result.current._verSiguiente());
    await act(async () => result.current._verSiguiente());
    expect(result.current.indice).toBe(0);
  });

  it('error: genérico si no hay mensaje; «Reintentar» vuelve a cargar', async () => {
    const repo = {
      ...crearMemoriaClasesRepository(),
      listarClases: () => Promise.resolve({ error: true }),
    } as unknown as ClasesRepository;
    const { result } = await montar(repo);
    await waitFor(() =>
      expect(result.current.estado).toEqual({
        tipo: 'error',
        msg: 'Ocurrió un error inesperado.',
      }),
    );
    repo.listarClases = () => Promise.resolve(respuestaOk(CLASES));
    await act(async () => result.current._cargar());
    expect(result.current.estado.tipo).toBe('listo');
  });

  it('un refresco fallido conserva la lista y el ciclo que se veía, y avisa', async () => {
    const repo = {
      ...crearMemoriaClasesRepository(),
      listarClases: jest.fn(() => Promise.resolve(respuestaOk(CLASES))),
    };
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._verAnterior());
    repo.listarClases.mockResolvedValueOnce(
      respuestaError('Sin red', 0) as never,
    );
    await act(async () => result.current._refrescar());
    expect(result.current.estado.tipo).toBe('listo');
    expect(result.current.indice).toBe(1);
    expect(result.current.refrescando).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: mensajesClases.noSeActualizo }),
    );
  });

  it('un refresco exitoso no mueve el ciclo que se veía', async () => {
    const { result } = await montar(crearMemoriaClasesRepository(CLASES));
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._verAnterior());
    await act(async () => result.current._refrescar());
    expect(result.current.indice).toBe(1);
  });

  it('si al refrescar hay menos ciclos, el índice no se sale de la lista', async () => {
    const repo = {
      ...crearMemoriaClasesRepository(),
      listarClases: jest.fn(() => Promise.resolve(respuestaOk(CLASES))),
    };
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._verAnterior());
    repo.listarClases.mockResolvedValueOnce(
      respuestaOk(CLASES.slice(0, 2)) as never,
    );
    await act(async () => result.current._refrescar());
    expect(result.current.indice).toBe(0);
  });

  it('el reloj avanza cada minuto y Zoom avisa si no abre', async () => {
    jest.useFakeTimers();
    let ahora = AHORA;
    const enlaces = { abrir: jest.fn(() => Promise.resolve(false)) };
    const { result } = await montar(
      crearMemoriaClasesRepository(),
      enlaces,
      () => ahora,
    );
    await act(async () => {});
    ahora += INTERVALO_RELOJ_CLASES_MS;
    await act(async () => {
      jest.advanceTimersByTime(INTERVALO_RELOJ_CLASES_MS);
    });
    expect(result.current.ahoraMs).toBe(AHORA + INTERVALO_RELOJ_CLASES_MS);
    jest.useRealTimers();
    await act(async () => result.current._abrirClase('https://zoom'));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: mensajesClases.noSeAbrioClase }),
    );
  });

  it('una carga que llega tras desmontar no actualiza nada', async () => {
    let soltar: () => void = () => {};
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository(),
      listarClases: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaOk(CLASES));
        }),
    };
    const { unmount } = await montar(repo);
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('useClasesController · cancelar (ramas)', () => {
  const vistaOk: VistaPreviaCancelacion = {
    puede: true,
    escenario: 'sin_tokens',
    estadoFinal: 'cancelled_no_tokens',
    opciones: [],
    descuentaToken: false,
    fecha: '2026-11-18',
    hora: '18:00',
    horasRestantes: 30,
    tokensUsados: 2,
    tokensMaximos: 2,
    afectaMinimo: false,
    minimo: 8,
    enGrupo: false,
  };

  async function montarCtl(repo: ClasesRepository) {
    const dependencias = crearDependenciasDePrueba({ clases: repo });
    return renderHook(
      () => useClasesController({ idEstudiante: 's1', ahora: () => AHORA }),
      { wrapper: envoltorio(dependencias) },
    );
  }

  it('confirmar sin vista abierta no hace nada', async () => {
    const repo = crearMemoriaClasesRepository(CLASES);
    const espia = jest.spyOn(repo, 'cancelarClase');
    const { result } = await montarCtl(repo);
    await act(async () => result.current._confirmarCancelacion());
    expect(espia).not.toHaveBeenCalled();
    expect(result.current.cancelacion).toEqual({ tipo: 'cerrada' });
  });

  it('abrir dos veces seguidas pide la vista una sola vez', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaClasesRepository(CLASES);
    const vistaPrevia = jest.fn(
      () =>
        new Promise<HttpResponse<VistaPreviaCancelacion>>(ok => {
          soltar = () => ok(respuestaOk(vistaOk));
        }),
    );
    const { result } = await montarCtl({
      ...base,
      vistaPreviaCancelacion: vistaPrevia,
    });
    await act(async () => {
      result.current._abrirCancelacion('f1');
      result.current._abrirCancelacion('f1');
    });
    expect(vistaPrevia).toHaveBeenCalledTimes(1);
    await act(async () => soltar());
    expect(result.current.cancelacion.tipo).toBe('lista');
  });

  it('desmontar mientras Leap responde la vista previa no actualiza nada', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaClasesRepository(CLASES);
    const repo: ClasesRepository = {
      ...base,
      vistaPreviaCancelacion: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaError('tarde', 500));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await act(async () => {
      result.current._abrirCancelacion('f1');
    });
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('mientras se envía no se cierra la hoja; al desmontar a mitad no se actualiza nada', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vistaOk },
    });
    const repo: ClasesRepository = {
      ...base,
      cancelarClase: () =>
        new Promise(ok => {
          soltar = () =>
            ok(respuestaOk({ estadoFinal: 'cancelled_no_tokens' }));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await act(async () => result.current._abrirCancelacion('f1'));
    await act(async () => {
      result.current._confirmarCancelacion();
    });
    await waitFor(() => {
      const c = result.current.cancelacion;
      expect(c.tipo === 'lista' && c.enviando).toBe(true);
    });
    await act(async () => result.current._cerrarCancelacion());
    expect(result.current.cancelacion.tipo).toBe('lista');
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('ClasesScreen', () => {
  async function montarPantalla(
    repo: ClasesRepository = crearMemoriaClasesRepository(CLASES),
    enlaces: EnlacesPort = { abrir: jest.fn(() => Promise.resolve(true)) },
  ) {
    jest.spyOn(Date, 'now').mockReturnValue(AHORA);
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'sinSesion' },
      clases: repo,
      enlaces,
    });
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <ClasesScreen usuario={{ id: 's1' }} />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    return { enlaces };
  }

  afterEach(() => jest.restoreAllMocks());

  it('muestra el ciclo actual con resumen, estados y la próxima clase con su Zoom', async () => {
    const { enlaces } = await montarPantalla();
    expect(await screen.findByText('Ciclo actual')).toBeOnTheScreen();
    expect(screen.getByText('5 nov – 4 dic')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tomadas: 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Programadas: 2')).toBeOnTheScreen();
    expect(screen.getByText('Tomada')).toBeOnTheScreen();
    // La reagendada va en su fecha nueva y recuerda la original.
    expect(
      screen.getByText('Clase 3 · con Meli · antes jue 12 nov'),
    ).toBeOnTheScreen();
    expect(screen.getByText('mar 24')).toBeOnTheScreen();
    expect(screen.queryByTestId('clase-p1')).toBeNull();
    expect(screen.getByText('Próxima')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ir a mi clase' }),
    );
    expect(enlaces.abrir).toHaveBeenCalledWith('https://zoom.us/j/meli');
  });

  it('las flechas pasan al ciclo anterior y vuelven', async () => {
    await montarPantalla();
    await screen.findByText('Ciclo actual');
    expect(screen.getByTestId('ciclo-siguiente')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('ciclo-anterior'));
    expect(screen.getByText('5 oct – 4 nov')).toBeOnTheScreen();
    expect(screen.getByTestId('clase-p1')).toBeOnTheScreen();
    expect(screen.getByText('No asististe')).toBeOnTheScreen();
    expect(screen.getByTestId('ciclo-anterior')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('ciclo-siguiente'));
    expect(screen.getByText('Ciclo actual')).toBeOnTheScreen();
  });

  it('sin clases: estado vacío honesto', async () => {
    await montarPantalla(crearMemoriaClasesRepository());
    expect(await screen.findByText('Aún no tienes clases')).toBeOnTheScreen();
    expect(screen.queryByTestId('selector-ciclo')).toBeNull();
  });

  it('error de carga: aviso con «Reintentar»', async () => {
    await montarPantalla({
      ...crearMemoriaClasesRepository(),
      listarClases: () => Promise.resolve(respuestaError('Sin conexión', 0)),
    });
    expect(await screen.findByTestId('clases-error')).toBeOnTheScreen();
    expect(screen.getByText('Sin conexión')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeOnTheScreen();
  });

  it('un ciclo sin clases lo dice; una clase sin hora ni profe se muestra igual', async () => {
    await montarPantalla(
      crearMemoriaClasesRepository([
        clase({
          id: 'x',
          hora: '',
          profe: null,
          numeroClase: null,
          enlaceZoom: null,
        }),
      ]),
    );
    expect(await screen.findByText('Sin hora')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Ir a mi clase' })).toBeNull();
  });
});
