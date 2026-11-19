// F2-01 (2.4): agendar una clase nueva (plan Flex). Leap decide si puede, cuántas quedan y qué
// espacios hay (el repositorio en memoria); la App muestra la tarjeta, deja escoger y confirma.
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
import { agendarClaseUseCase } from '@/modules/clases/aplications/agendarClase/agendarClase';
import { useClasesController } from '@/modules/clases/aplications/controllers/Clases.controller';
import type {
  EspaciosReagendar,
  EstadoAgendar,
  IEspacioReagendar,
} from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import {
  espaciosAgendarDe,
  estadoAgendarDe,
} from '@/modules/clases/infrastructure/apiClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { ClasesScreen } from '@/modules/clases/presentation/screens/ClasesScreen';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

// 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const CLASE = {
  id: 'c1',
  fecha: '2026-11-25',
  hora: '18:00',
  estado: 'scheduled',
  cuentaComoTomada: false,
  numeroClase: 1,
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

const PUEDE: EstadoAgendar = {
  aplica: true,
  puede: true,
  motivo: null,
  clasesRestantes: 7,
  minimo: 8,
  finCiclo: '2026-12-04',
  diasRestantes: 17,
};

const ESPACIOS: EspaciosReagendar = {
  puede: true,
  hasta: '2026-12-04',
  fechaOriginal: '',
  anticipacionHoras: 6,
  espacios: [meli('2026-11-18', '09:00'), meli('2026-11-19', '15:00')],
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

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('estadoAgendarDe / espaciosAgendarDe (respuesta de Leap)', () => {
  it('un plan que no es Flex no aplica', () => {
    expect(estadoAgendarDe({ puede: false, motivo: 'no_flex' })).toEqual({
      aplica: false,
    });
  });

  it('mapea el estado y acepta números como texto', () => {
    expect(
      estadoAgendarDe({
        puede: true,
        clasesRestantes: '7',
        minimo: 8,
        finCiclo: '2026-12-04',
        diasRestantes: '17',
      }),
    ).toEqual(PUEDE);
  });

  it('no puede: conserva el motivo; sin ciclo trae ceros', () => {
    expect(
      estadoAgendarDe({ puede: false, motivo: 'sin_ciclo' }),
    ).toMatchObject({
      aplica: true,
      puede: false,
      motivo: 'sin_ciclo',
      clasesRestantes: 0,
      finCiclo: null,
    });
  });

  it('formato desconocido → null', () => {
    expect(estadoAgendarDe({})).toBeNull();
  });

  it('los espacios de agendar usan el fin del ciclo como plazo', () => {
    expect(
      espaciosAgendarDe({
        puede: true,
        finCiclo: '2026-12-04',
        espacios: [
          {
            fecha: '2026-11-18',
            hora: '09:00',
            profe: 'Meli',
            idProfe: 'tm',
            esMiProfe: true,
          },
        ],
      }),
    ).toEqual({
      puede: true,
      hasta: '2026-12-04',
      fechaOriginal: '',
      anticipacionHoras: 6,
      espacios: [meli('2026-11-18', '09:00')],
    });
  });

  it('no puede agendar: conserva el motivo; sin motivo, sin cupo', () => {
    expect(
      espaciosAgendarDe({ puede: false, motivo: 'pago_pendiente' }),
    ).toEqual({ puede: false, motivo: 'pago_pendiente' });
    expect(espaciosAgendarDe({ puede: false })).toEqual({
      puede: false,
      motivo: 'sin_cupo',
    });
  });

  it('espacios sin la forma esperada → null', () => {
    expect(espaciosAgendarDe({ puede: true })).toBeNull();
  });
});

describe('agendarClaseUseCase', () => {
  const repo = crearMemoriaClasesRepository([], { espaciosAgendar: ESPACIOS });
  const args = {
    idEstudiante: 's1',
    fecha: '2026-11-18',
    hora: '09:00',
    idProfe: 'tm',
  };

  it('no se puede agendar: ni llama a Leap', async () => {
    const r = await agendarClaseUseCase(repo, args, {
      puede: false,
      motivo: 'sin_cupo',
    });
    expect(r.error).toBe(true);
  });

  it('no deja pasar un espacio que no está en la lista de Leap', async () => {
    const r = await agendarClaseUseCase(
      repo,
      { ...args, hora: '10:00' },
      ESPACIOS,
    );
    expect(r.error).toBe(true);
  });

  it('un espacio de la lista pasa', async () => {
    const r = await agendarClaseUseCase(repo, args, ESPACIOS);
    expect(r.error).toBe(false);
  });

  it('un error sin mensaje se vuelve el genérico', async () => {
    const sinMsg = {
      ...repo,
      agendarClase: async () => ({ error: true, response: null, code: 500 }),
    } as unknown as ClasesRepository;
    const r = await agendarClaseUseCase(sinMsg, args, ESPACIOS);
    expect(r.error).toBe(true);
    expect(r.msg).toBeTruthy();
  });
});

describe('tarjeta «Agendar una clase»', () => {
  it('un plan que no es Flex no la ve', async () => {
    await montar(crearMemoriaClasesRepository([CLASE]));
    expect(screen.queryByTestId('tarjeta-agendar')).toBeNull();
  });

  it('muestra cuántas quedan y el botón', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], { estadoAgendar: PUEDE }),
    );
    expect(await screen.findByTestId('tarjeta-agendar')).toBeOnTheScreen();
    expect(screen.getByText(/Puedes agendar 7 clases más/)).toBeOnTheScreen();
    expect(screen.queryByText(/pierden/)).toBeNull();
    expect(screen.getByTestId('agendar-abrir')).toBeOnTheScreen();
  });

  it('con una sola clase y poco ciclo avisa que se pierden', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: { ...PUEDE, clasesRestantes: 1, diasRestantes: 0 },
      }),
    );
    expect(
      await screen.findByText(/Puedes agendar 1 clase más/),
    ).toBeOnTheScreen();
    expect(screen.getByText(/termina hoy/)).toBeOnTheScreen();
  });

  it('dice «en 1 día» y «en N días» cuando faltan pocos', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: { ...PUEDE, diasRestantes: 1 },
      }),
    );
    expect(await screen.findByText(/termina en 1 día/)).toBeOnTheScreen();
  });

  it('con pocos días dice cuántos', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: { ...PUEDE, diasRestantes: 4 },
      }),
    );
    expect(await screen.findByText(/termina en 4 días/)).toBeOnTheScreen();
  });

  it('no puede: dice por qué y no hay botón', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: { ...PUEDE, puede: false, motivo: 'pago_pendiente' },
      }),
    );
    expect(await screen.findByTestId('agendar-no-puede')).toBeOnTheScreen();
    expect(screen.getByText(/pago pendiente/)).toBeOnTheScreen();
    expect(screen.queryByTestId('agendar-abrir')).toBeNull();
  });

  it('un motivo que la App no conoce se trata como sin cupo', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: { ...PUEDE, puede: false, motivo: null },
      }),
    );
    expect(await screen.findByText(/Ya agendaste todas/)).toBeOnTheScreen();
  });
});

describe('hoja de agendar', () => {
  const abrir = async () => {
    await fireEvent.press(await screen.findByTestId('agendar-abrir'));
    return screen.findByTestId('hoja-agendar');
  };

  it('muestra el plazo (fin del ciclo) y los espacios; confirmar espera a que se escoja', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: PUEDE,
        espaciosAgendar: ESPACIOS,
      }),
    );
    await abrir();
    expect(
      await screen.findByText(/el último día de tu ciclo/),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('dia-2026-11-18')).toBeOnTheScreen();
    expect(screen.getByTestId('agendar-confirmar')).toBeDisabled();
  });

  it('sin plazo de Leap, el texto es genérico', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: PUEDE,
        espaciosAgendar: { ...ESPACIOS, hasta: null } as EspaciosReagendar,
      }),
    );
    await abrir();
    expect(
      await screen.findByText('Escoge el espacio que más te convenga.'),
    ).toBeOnTheScreen();
  });

  it('sin espacios: lo dice y no deja confirmar', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: PUEDE,
        espaciosAgendar: { ...ESPACIOS, espacios: [] } as EspaciosReagendar,
      }),
    );
    await abrir();
    expect(await screen.findByTestId('agendar-vacio')).toBeOnTheScreen();
  });

  it('Leap dice que ya no puede (se llenó el cupo): muestra el motivo y «Entendido» cierra', async () => {
    await montar(
      crearMemoriaClasesRepository([CLASE], {
        estadoAgendar: PUEDE,
        espaciosAgendar: { puede: false, motivo: 'sin_cupo' },
      }),
    );
    await abrir();
    expect(
      await screen.findByText('No puedes agendar ahora'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('agendar-entendido'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-agendar')).toBeNull(),
    );
  });

  it('escoge, agenda, avisa y refresca clases y estado', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      estadoAgendar: PUEDE,
      espaciosAgendar: ESPACIOS,
    });
    const agendar = jest.spyOn(repo, 'agendarClase');
    const listar = jest.spyOn(repo, 'listarClases');
    const estado = jest.spyOn(repo, 'estadoAgendar');
    await montar(repo);
    await abrir();
    await fireEvent.press(
      await screen.findByTestId('espacio-2026-11-18-09:00-tm'),
    );
    expect(await screen.findByTestId('agendar-elegido')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('agendar-confirmar'));
    await waitFor(() =>
      expect(agendar).toHaveBeenCalledWith({
        idEstudiante: 's1',
        fecha: '2026-11-18',
        hora: '09:00',
        idProfe: 'tm',
      }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-agendar')).toBeNull(),
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Clase agendada' }),
    );
    expect(listar).toHaveBeenCalledTimes(2);
    expect(estado).toHaveBeenCalledTimes(2);
  });

  it('el espacio se ocupó (409): muestra el error y refresca', async () => {
    const repo = crearMemoriaClasesRepository([CLASE], {
      estadoAgendar: PUEDE,
      espaciosAgendar: ESPACIOS,
      agendarError: { msg: 'Ese espacio ya no está disponible.', code: 409 },
    });
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrir();
    await fireEvent.press(
      await screen.findByTestId('espacio-2026-11-18-09:00-tm'),
    );
    await fireEvent.press(screen.getByTestId('agendar-confirmar'));
    expect(
      await screen.findByText('Ese espacio ya no está disponible.'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('agendar-confirmar')).toBeDisabled();
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });
});

describe('useClasesController · agendar', () => {
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

  it('abrir dos veces seguidas pide los espacios una sola vez', async () => {
    let soltar: () => void = () => undefined;
    const base = crearMemoriaClasesRepository([CLASE]);
    const pedir = jest.fn(
      () =>
        new Promise<
          Awaited<ReturnType<ClasesRepository['espaciosParaAgendar']>>
        >(ok => {
          soltar = () => ok(respuestaOk(ESPACIOS));
        }),
    );
    const { result } = await montarCtl({ ...base, espaciosParaAgendar: pedir });
    await act(async () => {
      result.current._abrirAgendar();
      result.current._abrirAgendar();
    });
    expect(pedir).toHaveBeenCalledTimes(1);
    await act(async () => soltar());
    expect(result.current.reagendacion.tipo).toBe('lista');
  });

  it('no se pueden cargar los espacios: avisa y no abre la hoja', async () => {
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository([CLASE]),
      espaciosParaAgendar: async () => respuestaError('Sin conexión', 500),
    };
    const { result } = await montarCtl(repo);
    await act(async () => result.current._abrirAgendar());
    expect(result.current.reagendacion).toEqual({ tipo: 'cerrada' });
    expect(Toast.show).toHaveBeenCalled();
  });

  it('desmontar mientras Leap responde los espacios no actualiza nada', async () => {
    let soltar: () => void = () => undefined;
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository([CLASE]),
      espaciosParaAgendar: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaError('tarde', 500));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await act(async () => {
      result.current._abrirAgendar();
    });
    await unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('el estado de agendar que llega tarde (la pantalla ya se cerró) se descarta', async () => {
    let soltar: () => void = () => undefined;
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository([CLASE]),
      estadoAgendar: () =>
        new Promise(ok => {
          soltar = () => ok(respuestaOk(PUEDE));
        }),
    };
    const { result, unmount } = await montarCtl(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    await unmount();
    await act(async () => soltar());
    expect(result.current.agenda).toBeNull();
  });

  it('un estado de agendar que falla deja la tarjeta oculta, sin avisar', async () => {
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository([CLASE]),
      estadoAgendar: async () => respuestaError('x', 500),
    };
    const { result } = await montarCtl(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(result.current.agenda).toBeNull();
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
