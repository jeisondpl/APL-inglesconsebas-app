// F2-02: la pantalla de la agenda del profe (día, semana, marcar) y su controller, con el
// repositorio en memoria. Hoy es mar 17 nov 2026, 10:00 en Bogotá.
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

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  INTERVALO_RELOJ_AGENDA_MS,
  useAgendaController,
} from '@/modules/agenda/aplications/controllers/Agenda.controller';
import type { IResponseClaseAgenda } from '@/modules/agenda/domain/entities/Agenda.entities';
import type { AgendaRepository } from '@/modules/agenda/domain/models/AgendaRepository';
import { crearMemoriaAgendaRepository } from '@/modules/agenda/infrastructure/memoriaAgendaRepository';
import { AgendaScreen } from '@/modules/agenda/presentation/screens/AgendaScreen';
import type { EnlacesPort } from '@/native/ports/EnlacesPort';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const clase = (c: Partial<IResponseClaseAgenda>): IResponseClaseAgenda => ({
  id: 'c1',
  idEstudiante: 'e1',
  fecha: '2026-11-17',
  hora: '08:00',
  idProfe: 'p1',
  estado: 'scheduled',
  numeroClase: 3,
  enlaceZoom: null,
  ...c,
});

const CLASES: IResponseClaseAgenda[] = [
  clase({ id: 'pasada', hora: '08:00' }), // ya terminó: sin marcar
  clase({
    id: 'proxima',
    hora: '18:00',
    idEstudiante: 'e2',
    enlaceZoom: 'https://zoom',
  }),
  clase({ id: 'ayer', fecha: '2026-11-16', hora: '10:00' }),
  clase({ id: 'manana', fecha: '2026-11-18', hora: '10:00' }),
  clase({ id: 'ajena', idProfe: 'otra' }),
];
const ESTUDIANTES = [
  { id: 'e1', nombre: 'Ana' },
  { id: 'e2', nombre: 'Luis' },
];

const envoltorio =
  (repo: AgendaRepository, enlaces?: Partial<EnlacesPort>) =>
  ({ children }: { children: ReactNode }) => {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'sinSesion' },
      agenda: repo,
    });
    const conEnlaces = enlaces
      ? {
          ...dependencias,
          nativos: {
            ...dependencias.nativos,
            enlaces: { abrir: jest.fn(), ...enlaces } as EnlacesPort,
          },
        }
      : dependencias;
    return (
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={conEnlaces}>
            {children}
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>
    );
  };

/** Wrapper de hooks: solo las dependencias, creadas una vez. */
const envoltorioCtl = (repo: AgendaRepository) => {
  const dependencias = crearDependenciasDePrueba({ agenda: repo });
  return ({ children }: { children: ReactNode }) => (
    <DependenciasProvider valor={dependencias}>{children}</DependenciasProvider>
  );
};

async function montar(repo: AgendaRepository, enlaces?: Partial<EnlacesPort>) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const Envoltorio = envoltorio(repo, enlaces);
  await render(
    <Envoltorio>
      <AgendaScreen usuario={{ id: 'p1' }} />
    </Envoltorio>,
  );
  await screen.findByTestId('selector-vista');
}

const memoria = (extra = {}) =>
  crearMemoriaAgendaRepository(CLASES, { estudiantes: ESTUDIANTES, ...extra });

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('vista Día', () => {
  it('muestra las clases de hoy con nombre y momento, y «Hoy»', async () => {
    await montar(memoria());
    expect(screen.getByTestId('lista-dia')).toBeOnTheScreen();
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
    expect(screen.getByText('Luis')).toBeOnTheScreen();
    expect(screen.queryByTestId('clase-ajena')).toBeNull();
    expect(screen.getAllByText('Sin marcar').length).toBeGreaterThan(0);
    expect(screen.getByText('Próxima')).toBeOnTheScreen();
    expect(screen.getByText('2 clases')).toBeOnTheScreen();
  });

  it('solo la próxima lleva Zoom y solo la ya empezada lleva los botones de marcar', async () => {
    await montar(memoria());
    expect(screen.getByTestId('zoom-proxima')).toBeOnTheScreen();
    expect(screen.queryByTestId('zoom-pasada')).toBeNull();
    expect(screen.getByTestId('realizada-pasada')).toBeOnTheScreen();
    expect(screen.queryByTestId('realizada-proxima')).toBeNull();
  });

  it('las de días anteriores sin marcar salen aparte', async () => {
    await montar(memoria());
    expect(screen.getByTestId('sin-marcar-anteriores')).toBeOnTheScreen();
    expect(screen.getByTestId('realizada-ayer')).toBeOnTheScreen();
  });

  it('flechas: día siguiente y anterior, y «Hoy» vuelve', async () => {
    await montar(memoria());
    await fireEvent.press(screen.getByTestId('agenda-siguiente'));
    expect(screen.getByTestId('clase-manana')).toBeOnTheScreen();
    expect(screen.queryByTestId('clase-pasada')).toBeNull();
    await fireEvent.press(screen.getByTestId('agenda-hoy'));
    expect(screen.getByTestId('clase-pasada')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('agenda-anterior'));
    expect(screen.getByTestId('agenda-fecha')).toHaveTextContent('lun 16 nov');
  });

  it('un día sin clases lo dice', async () => {
    await montar(memoria());
    await fireEvent.press(screen.getByTestId('agenda-siguiente'));
    await fireEvent.press(screen.getByTestId('agenda-siguiente'));
    expect(screen.getByTestId('dia-vacio')).toBeOnTheScreen();
  });

  it('un Zoom que no abre avisa', async () => {
    await montar(memoria(), { abrir: jest.fn(() => Promise.resolve(false)) });
    await fireEvent.press(screen.getByTestId('zoom-proxima'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalled());
  });
});

describe('vista Semana', () => {
  it('muestra los siete días con sus conteos y abre el día tocado', async () => {
    await montar(memoria());
    await fireEvent.press(screen.getByTestId('vista-semana'));
    expect(screen.getByTestId('lista-semana')).toBeOnTheScreen();
    expect(screen.getByTestId('semana-2026-11-17')).toBeOnTheScreen();
    expect(screen.getAllByText('1 sin marcar').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('semana-2026-11-18'));
    expect(screen.getByTestId('lista-dia')).toBeOnTheScreen();
    expect(screen.getByTestId('clase-manana')).toBeOnTheScreen();
  });

  it('las flechas mueven una semana y «Hoy» aparece al salir de la actual', async () => {
    await montar(memoria());
    await fireEvent.press(screen.getByTestId('vista-semana'));
    expect(screen.queryByTestId('agenda-hoy')).toBeNull();
    await fireEvent.press(screen.getByTestId('agenda-siguiente'));
    expect(screen.getByText('23 nov – 29 nov')).toBeOnTheScreen();
    expect(screen.getAllByText('Sin clases').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByTestId('agenda-hoy'));
    expect(screen.getByText('16 nov – 22 nov')).toBeOnTheScreen();
  });
});

describe('marcar asistencia', () => {
  const abrir = async (id: string, boton = 'realizada') => {
    await fireEvent.press(screen.getByTestId(`${boton}-${id}`));
    return screen.findByTestId('hoja-marcar');
  };

  it('«Realizada»: pide confirmación, marca, avisa y refresca', async () => {
    const repo = memoria();
    const marcar = jest.spyOn(repo, 'marcarClase');
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrir('pasada');
    expect(screen.getByText('¿La clase se realizó?')).toBeOnTheScreen();
    expect(marcar).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('marcar-confirmar'));
    await waitFor(() =>
      expect(marcar).toHaveBeenCalledWith({
        idClase: 'pasada',
        marca: 'taken',
      }),
    );
    await waitFor(() => expect(screen.queryByTestId('hoja-marcar')).toBeNull());
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Clase marcada como realizada' }),
    );
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('«No asistió»: texto propio y marca no_show', async () => {
    const repo = memoria();
    const marcar = jest.spyOn(repo, 'marcarClase');
    await montar(repo);
    await abrir('pasada', 'no-asistio');
    expect(screen.getByText('¿El estudiante no asistió?')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('marcar-confirmar'));
    await waitFor(() =>
      expect(marcar).toHaveBeenCalledWith({
        idClase: 'pasada',
        marca: 'no_show',
      }),
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Marcada como «No asistió»' }),
    );
  });

  it('Leap rechaza: deja el error visible y vuelve a leer', async () => {
    const repo = memoria({
      marcarError: { msg: 'Esta clase ya tiene una marca.', code: 403 },
    });
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrir('pasada');
    await fireEvent.press(screen.getByTestId('marcar-confirmar'));
    expect(
      await screen.findByText('Esta clase ya tiene una marca.'),
    ).toBeOnTheScreen();
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });

  it('volver y el velo cierran la hoja sin marcar', async () => {
    const repo = memoria();
    const marcar = jest.spyOn(repo, 'marcarClase');
    await montar(repo);
    await abrir('pasada');
    await fireEvent.press(screen.getByTestId('marcar-volver'));
    await waitFor(() => expect(screen.queryByTestId('hoja-marcar')).toBeNull());
    await abrir('pasada');
    await fireEvent.press(
      screen.getByTestId('velo-marcar', { includeHiddenElements: true }),
    );
    await waitFor(() => expect(screen.queryByTestId('hoja-marcar')).toBeNull());
    expect(marcar).not.toHaveBeenCalled();
  });

  it('también se marca desde las clases de días anteriores', async () => {
    const repo = memoria();
    const marcar = jest.spyOn(repo, 'marcarClase');
    await montar(repo);
    await abrir('ayer');
    await fireEvent.press(screen.getByTestId('marcar-confirmar'));
    await waitFor(() =>
      expect(marcar).toHaveBeenCalledWith({ idClase: 'ayer', marca: 'taken' }),
    );
  });
});

describe('estados de carga', () => {
  it('error al cargar: muestra el aviso y «Reintentar» vuelve a pedir', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(AHORA);
    const repo = crearMemoriaAgendaRepository();
    let intento = 0;
    jest.spyOn(repo, 'listarClases').mockImplementation(async () => {
      intento += 1;
      return intento === 1
        ? respuestaError('Sin conexión', 0)
        : respuestaOk([]);
    });
    const Envoltorio = envoltorio(repo);
    await render(
      <Envoltorio>
        <AgendaScreen usuario={{ id: 'p1' }} />
      </Envoltorio>,
    );
    expect(await screen.findByTestId('agenda-error')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(await screen.findByTestId('selector-vista')).toBeOnTheScreen();
  });
});

describe('useAgendaController', () => {
  async function montarCtl(repo: AgendaRepository) {
    return renderHook(
      () => useAgendaController({ idProfe: 'p1', ahora: () => AHORA }),
      { wrapper: envoltorioCtl(repo) },
    );
  }

  it('confirmar o pedir una marca sin clase no hace nada', async () => {
    const repo = memoria();
    const marcar = jest.spyOn(repo, 'marcarClase');
    const { result } = await montarCtl(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._confirmarMarca());
    await act(async () => result.current._pedirMarca('no-existe', 'taken'));
    expect(result.current.marca).toEqual({ tipo: 'cerrada' });
    expect(marcar).not.toHaveBeenCalled();
  });

  it('un refresco fallido conserva lo que se ve y avisa', async () => {
    const repo = memoria();
    const { result } = await montarCtl(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    jest
      .spyOn(repo, 'listarClases')
      .mockResolvedValue(respuestaError('Sin conexión', 0));
    await act(async () => result.current._refrescar());
    expect(result.current.estado.tipo).toBe('listo');
    expect(Toast.show).toHaveBeenCalled();
    expect(result.current.refrescando).toBe(false);
  });

  it('el reloj recalcula el momento cada minuto', async () => {
    const intervalo = jest.spyOn(global, 'setInterval');
    let ahora = AHORA;
    const repo = memoria();
    const { result } = await renderHook(
      () => useAgendaController({ idProfe: 'p1', ahora: () => ahora }),
      { wrapper: envoltorioCtl(repo) },
    );
    const llamada = intervalo.mock.calls.find(
      ([, ms]) => ms === INTERVALO_RELOJ_AGENDA_MS,
    );
    expect(llamada).toBeDefined();
    const antes = result.current.ahoraMs;
    ahora += INTERVALO_RELOJ_AGENDA_MS;
    await act(async () => (llamada?.[0] as () => void)());
    expect(result.current.ahoraMs).toBe(antes + INTERVALO_RELOJ_AGENDA_MS);
  });

  it('mientras se envía no se cierra la hoja, no se confirma dos veces y, al desmontar a mitad, no se actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const base = memoria();
    const marcar = jest.fn(
      () =>
        new Promise<Awaited<ReturnType<AgendaRepository['marcarClase']>>>(
          ok => {
            soltar = () => ok(respuestaOk({ estadoFinal: 'taken' }));
          },
        ),
    );
    const { result, unmount } = await montarCtl({
      ...base,
      marcarClase: marcar,
    });
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await act(async () => result.current._pedirMarca('pasada', 'taken'));
    await act(async () => {
      result.current._confirmarMarca();
      result.current._confirmarMarca();
    });
    await waitFor(() => {
      const m = result.current.marca;
      expect(m.tipo === 'confirmar' && m.enviando).toBe(true);
    });
    await act(async () => result.current._cancelarMarca());
    expect(result.current.marca.tipo).toBe('confirmar');
    expect(marcar).toHaveBeenCalledTimes(1);
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('una carga que llega después de desmontar no actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const repo: AgendaRepository = {
      ...memoria(),
      listarClases: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaError('tarde', 500));
        }),
    };
    const { unmount } = await montarCtl(repo);
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('una carga vieja que llega después de otra más nueva se descarta', async () => {
    const soltar: (() => void)[] = [];
    const base = memoria();
    let llamada = 0;
    const repo: AgendaRepository = {
      ...base,
      listarClases: () => {
        llamada += 1;
        return new Promise(ok => {
          soltar.push(() => ok(respuestaOk(llamada === 1 ? [] : CLASES)));
        });
      },
    };
    const { result } = await montarCtl(repo);
    await act(async () => {
      result.current._refrescar();
    });
    await act(async () => soltar[1]());
    await act(async () => soltar[0]());
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
  });
});
