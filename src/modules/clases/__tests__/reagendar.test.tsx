// F2-01 (2.3): escoger un nuevo espacio para una clase «por reagendar». Los espacios ya vienen
// filtrados por «Leap» (el repositorio en memoria); la App solo escoge y confirma.
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
import { useClasesController } from '@/modules/clases/aplications/controllers/Clases.controller';
import { reagendarClaseUseCase } from '@/modules/clases/aplications/reagendarClase/reagendarClase';
import type {
  EspaciosReagendar,
  IEspacioReagendar,
  IResponseClase,
} from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { espaciosPorDia } from '@/modules/clases/domain/validations/clases.validations';
import { espaciosDe } from '@/modules/clases/infrastructure/apiClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { ClasesScreen } from '@/modules/clases/presentation/screens/ClasesScreen';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

// 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const CLASE: IResponseClase = {
  id: 'r1',
  fecha: '2026-12-02',
  hora: '18:00',
  estado: 'to_reschedule',
  cuentaComoTomada: false,
  numeroClase: 4,
  inicioCiclo: '2026-11-05',
  finCiclo: '2026-12-04',
  fechaNueva: null,
  horaNueva: null,
  profe: 'Meli',
  enlaceZoom: null,
};

const meli = (fecha: string, hora: string): IEspacioReagendar => ({
  fecha,
  hora,
  profe: 'Meli',
  idProfe: 'tm',
  esMiProfe: true,
});
const caro = (fecha: string, hora: string): IEspacioReagendar => ({
  fecha,
  hora,
  profe: 'Caro',
  idProfe: 'tc',
  esMiProfe: false,
});

const DATOS: EspaciosReagendar = {
  puede: true,
  hasta: '2026-12-20',
  fechaOriginal: '2026-12-02',
  anticipacionHoras: 6,
  espacios: [
    caro('2026-11-19', '09:00'),
    meli('2026-11-19', '15:00'),
    meli('2026-11-18', '09:00'),
  ],
};

async function montar(repo: ClasesRepository) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const dependencias = crearDependenciasDePrueba({
    estadoInicial: { tipo: 'sinSesion' },
    clases: repo,
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
  await screen.findByTestId('lista-clases');
}

const abrir = async () => {
  await fireEvent.press(screen.getByTestId('reagendar-r1'));
  return screen.findByTestId('hoja-reagendar');
};
const incluirOcultos = { includeHiddenElements: true } as const;

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('espaciosPorDia', () => {
  it('ordena por fecha y, en cada día, primero su profe y luego por hora', () => {
    const dias = espaciosPorDia(DATOS.puede ? DATOS.espacios : []);
    expect(dias.map(d => d.fecha)).toEqual(['2026-11-18', '2026-11-19']);
    expect(dias[1].espacios.map(e => e.profe)).toEqual(['Meli', 'Caro']);
  });
});

describe('espaciosDe (respuesta de Leap)', () => {
  it('no se puede: conserva el motivo', () => {
    expect(espaciosDe({ puede: false, motivo: 'vencida' })).toEqual({
      puede: false,
      motivo: 'vencida',
    });
    expect(espaciosDe({ puede: false })).toEqual({
      puede: false,
      motivo: 'no_reagendable',
    });
  });

  it('mapea los espacios y descarta los incompletos', () => {
    const r = espaciosDe({
      puede: true,
      hasta: '2026-12-20',
      fechaOriginal: '2026-12-02',
      anticipacionHoras: '6',
      espacios: [
        {
          fecha: '2026-11-18',
          hora: '09:00',
          profe: 'Meli',
          idProfe: 'tm',
          esMiProfe: true,
        },
        { fecha: '2026-11-18', hora: '10:00' },
      ],
    });
    expect(r).toEqual({
      puede: true,
      hasta: '2026-12-20',
      fechaOriginal: '2026-12-02',
      anticipacionHoras: 6,
      espacios: [meli('2026-11-18', '09:00')],
    });
  });

  it('formato desconocido → null', () => {
    expect(espaciosDe({})).toBeNull();
    expect(espaciosDe({ puede: true })).toBeNull();
  });
});

describe('reagendarClaseUseCase', () => {
  const repo = crearMemoriaClasesRepository([], { espacios: { r1: DATOS } });
  const args = {
    idClase: 'r1',
    fecha: '2026-11-18',
    hora: '09:00',
    idProfe: 'tm',
  };

  it('no deja pasar un espacio que no está en la lista de Leap', async () => {
    const r = await reagendarClaseUseCase(
      repo,
      { ...args, hora: '10:00' },
      DATOS,
    );
    expect(r.error).toBe(true);
  });

  it('no se puede reagendar: ni llama a Leap', async () => {
    const r = await reagendarClaseUseCase(repo, args, {
      puede: false,
      motivo: 'vencida',
    });
    expect(r.error).toBe(true);
  });

  it('un espacio de la lista pasa', async () => {
    const r = await reagendarClaseUseCase(repo, args, DATOS);
    expect(r.error).toBe(false);
  });

  it('un error sin mensaje se vuelve el genérico', async () => {
    const sinMsg: ClasesRepository = {
      ...repo,
      reagendarClase: async () => ({ error: true, response: null, code: 500 }),
    } as unknown as ClasesRepository;
    const r = await reagendarClaseUseCase(sinMsg, args, DATOS);
    expect(r.error).toBe(true);
    expect(r.msg).toBeTruthy();
  });
});

describe('botón «Escoger nuevo espacio»', () => {
  it('solo en la clase por reagendar', async () => {
    await montar(
      crearMemoriaClasesRepository([
        CLASE,
        { ...CLASE, id: 'p', estado: 'taken' },
      ]),
    );
    expect(screen.getByTestId('reagendar-r1')).toBeOnTheScreen();
    expect(screen.queryByTestId('reagendar-p')).toBeNull();
  });
});

describe('hoja de reagendar', () => {
  it('no se puede (Leap lo dice): muestra el motivo y «Entendido» cierra', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        espacios: { r1: { puede: false, motivo: 'vencida' } },
      }),
    );
    await abrir();
    expect(await screen.findByText('No se puede reagendar')).toBeOnTheScreen();
    expect(screen.getByText(/plazo para reagendar/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('reagendar-entendido'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-reagendar')).toBeNull(),
    );
  });

  it('sin espacios: lo dice y no deja confirmar', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        espacios: { r1: { ...DATOS, espacios: [] } as EspaciosReagendar },
      }),
    );
    await abrir();
    expect(await screen.findByTestId('reagendar-vacio')).toBeOnTheScreen();
    expect(screen.getByTestId('reagendar-confirmar')).toBeDisabled();
  });

  it('muestra el plazo y los espacios por día; confirmar espera a que se escoja uno', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], { espacios: { r1: DATOS } }),
    );
    await abrir();
    expect(await screen.findByText(/Tienes hasta el/)).toBeOnTheScreen();
    expect(screen.getByTestId('dia-2026-11-18')).toBeOnTheScreen();
    expect(screen.getByTestId('dia-2026-11-19')).toBeOnTheScreen();
    expect(screen.getByTestId('reagendar-confirmar')).toBeDisabled();
  });

  it('escoge, confirma, avisa y refresca', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      espacios: { r1: DATOS },
    });
    const reagendar = jest.spyOn(repo, 'reagendarClase');
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrir();
    await fireEvent.press(
      await screen.findByTestId('espacio-2026-11-18-09:00-tm'),
    );
    expect(await screen.findByTestId('reagendar-elegido')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('reagendar-confirmar'));
    await waitFor(() =>
      expect(reagendar).toHaveBeenCalledWith({
        idClase: 'r1',
        fecha: '2026-11-18',
        hora: '09:00',
        idProfe: 'tm',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-reagendar')).toBeNull(),
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Clase reagendada' }),
    );
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('el espacio se ocupó (409): muestra el error, quita lo elegido y refresca', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      espacios: { r1: DATOS },
      reagendarError: { msg: 'Ese espacio ya no está disponible.', code: 409 },
    });
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrir();
    await fireEvent.press(
      await screen.findByTestId('espacio-2026-11-18-09:00-tm'),
    );
    await fireEvent.press(screen.getByTestId('reagendar-confirmar'));
    expect(
      await screen.findByText('Ese espacio ya no está disponible.'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('reagendar-elegido')).toBeNull();
    expect(screen.getByTestId('reagendar-confirmar')).toBeDisabled();
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });

  it('no se puede cargar la lista: avisa y no abre la hoja', async () => {
    const repo = crearMemoriaClasesRepository([CLASE]);
    jest.spyOn(repo, 'espaciosParaReagendar').mockResolvedValue({
      error: true,
      response: null,
      msg: 'Sin conexión',
    } as never);
    await montar(repo);
    await fireEvent.press(screen.getByTestId('reagendar-r1'));
    await waitFor(() => expect(Toast.show).toHaveBeenCalled());
    expect(screen.queryByTestId('hoja-reagendar', incluirOcultos)).toBeNull();
  });

  it('volver y el velo cierran la hoja', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], { espacios: { r1: DATOS } }),
    );
    await abrir();
    await fireEvent.press(await screen.findByTestId('reagendar-volver'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-reagendar')).toBeNull(),
    );
    await abrir();
    await fireEvent.press(screen.getByTestId('velo-reagendar', incluirOcultos));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-reagendar')).toBeNull(),
    );
  });

  it('no se puede escoger ni confirmar mientras se envía', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      espacios: { r1: DATOS },
    });
    let soltar: () => void = () => undefined;
    jest.spyOn(repo, 'reagendarClase').mockImplementation(
      () =>
        new Promise(resolver => {
          soltar = () => resolver(respuestaOk({ ok: true as const }));
        }),
    );
    await montar(repo);
    await abrir();
    await fireEvent.press(
      await screen.findByTestId('espacio-2026-11-18-09:00-tm'),
    );
    fireEvent.press(screen.getByTestId('reagendar-confirmar'));
    await waitFor(() =>
      expect(screen.getByTestId('reagendar-volver')).toBeDisabled(),
    );
    soltar();
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-reagendar')).toBeNull(),
    );
  });
});

describe('useClasesController · reagendar', () => {
  async function montarCtl(repo: ClasesRepository) {
    const dependencias = crearDependenciasDePrueba({ clases: repo });
    return renderHook(
      () => useClasesController({ idEstudiante: 's1', ahora: () => AHORA }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <DependenciasProvider valor={dependencias}>
            {children}
          </DependenciasProvider>
        ),
      },
    );
  }

  it('confirmar sin escoger espacio no hace nada', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      espacios: { r1: DATOS },
    });
    const espia = jest.spyOn(repo, 'reagendarClase');
    const { result } = await montarCtl(repo);
    await act(async () => result.current._confirmarReagendar());
    await act(async () => result.current._abrirReagendar('r1'));
    await act(async () => result.current._confirmarReagendar());
    expect(espia).not.toHaveBeenCalled();
    expect(result.current.reagendacion.tipo).toBe('lista');
  });

  it('abrir dos veces seguidas pide los espacios una sola vez', async () => {
    let soltar: () => void = () => undefined;
    const base = crearMemoriaClasesRepository([CLASE]);
    const pedir = jest.fn(
      () =>
        new Promise<
          Awaited<ReturnType<ClasesRepository['espaciosParaReagendar']>>
        >(ok => {
          soltar = () => ok(respuestaOk(DATOS));
        }),
    );
    const { result } = await montarCtl({
      ...base,
      espaciosParaReagendar: pedir,
    });
    await act(async () => {
      result.current._abrirReagendar('r1');
      result.current._abrirReagendar('r1');
    });
    expect(pedir).toHaveBeenCalledTimes(1);
    await act(async () => soltar());
    expect(result.current.reagendacion.tipo).toBe('lista');
  });

  it('desmontar mientras Leap responde los espacios no actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const base = crearMemoriaClasesRepository([CLASE]);
    const repo: ClasesRepository = {
      ...base,
      espaciosParaReagendar: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaError('tarde', 500));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await act(async () => {
      result.current._abrirReagendar('r1');
    });
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('mientras se envía no se cierra ni se cambia el espacio; al desmontar a mitad no se actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const base = crearMemoriaClasesRepository([CLASE], {
      espacios: { r1: DATOS },
    });
    const repo: ClasesRepository = {
      ...base,
      reagendarClase: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaOk({ ok: true as const }));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await act(async () => result.current._abrirReagendar('r1'));
    await act(async () =>
      result.current._elegirEspacio(meli('2026-11-18', '09:00')),
    );
    await act(async () => {
      result.current._confirmarReagendar();
    });
    await waitFor(() => {
      const r = result.current.reagendacion;
      expect(r.tipo === 'lista' && r.enviando).toBe(true);
    });
    await act(async () => result.current._cerrarReagendar());
    await act(async () =>
      result.current._elegirEspacio(caro('2026-11-19', '09:00')),
    );
    const r = result.current.reagendacion;
    expect(r.tipo === 'lista' && r.elegido?.profe).toBe('Meli');
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
