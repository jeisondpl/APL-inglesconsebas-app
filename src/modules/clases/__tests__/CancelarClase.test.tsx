// F2-01 (2.2): la hoja de cancelar en la pantalla de Clases y el flujo del controlador, con el
// repositorio en memoria. El escenario y el estado final los pone «Leap» (la vista previa).
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type {
  IResponseClase,
  VistaPreviaCancelacion,
} from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { ClasesScreen } from '@/modules/clases/presentation/screens/ClasesScreen';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
import { TemaProvider } from '@/shared/theme';

// 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const CLASES: IResponseClase[] = [
  {
    id: 'f1',
    fecha: '2026-11-18',
    hora: '18:00',
    estado: 'scheduled',
    cuentaComoTomada: false,
    numeroClase: 2,
    inicioCiclo: '2026-11-05',
    finCiclo: '2026-12-04',
    fechaNueva: null,
    horaNueva: null,
    profe: 'Meli',
    enlaceZoom: null,
  },
  {
    id: 'pasada',
    fecha: '2026-11-10',
    hora: '18:00',
    estado: 'taken',
    cuentaComoTomada: true,
    numeroClase: 1,
    inicioCiclo: '2026-11-05',
    finCiclo: '2026-12-04',
    fechaNueva: null,
    horaNueva: null,
    profe: 'Meli',
    enlaceZoom: null,
  },
];

const vista = (
  cambios: Partial<Extract<VistaPreviaCancelacion, { puede: true }>>,
) =>
  ({
    puede: true,
    escenario: 'sin_tokens',
    estadoFinal: 'cancelled_no_tokens',
    opciones: [],
    descuentaToken: false,
    fecha: '2026-11-18',
    hora: '18:00',
    horasRestantes: 32,
    tokensUsados: 2,
    tokensMaximos: 2,
    afectaMinimo: false,
    minimo: 8,
    enGrupo: false,
    ...cambios,
  } as VistaPreviaCancelacion);

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

const abrirHoja = async () => {
  await fireEvent.press(screen.getByTestId('cancelar-f1'));
  return screen.findByTestId('hoja-cancelacion');
};

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('botón «Cancelar clase»', () => {
  it('solo en la clase programada que no ha empezado, no en la tomada', async () => {
    await montar(crearMemoriaClasesRepository(CLASES));
    expect(screen.getByTestId('cancelar-f1')).toBeOnTheScreen();
    expect(screen.queryByTestId('cancelar-pasada')).toBeNull();
  });
});

describe('hoja de cancelar', () => {
  it('no se puede (Leap lo dice): muestra el motivo y «Entendido» cierra', async () => {
    await montar(
      crearMemoriaClasesRepository(CLASES, {
        vistasPrevias: { f1: { puede: false, motivo: 'ya_empezo' } },
      }),
    );
    await abrirHoja();
    expect(await screen.findByText('No se puede cancelar')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Esta clase ya empezó, así que ya no se puede cancelar ni mover.',
      ),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('cancelacion-entendido'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-cancelacion')).toBeNull(),
    );
  });

  it.each([
    [
      'flex_libera',
      'cancelled_no_impact',
      'Liberar tu clase',
      'Sí, liberar la clase',
    ],
    [
      'flex_tarde',
      'cancelled_late',
      'Cancelación con menos de 24 horas',
      'Sí, cancelar',
    ],
    ['power_tarde', 'cancelled_late', 'Cancelación tardía', 'Sí, cancelar'],
    [
      'reagendar_necesario',
      'cancelled_impacts_min',
      'Cancelar y reagendar',
      'Sí, cancelar y reagendar',
    ],
    [
      'sin_tokens',
      'cancelled_no_tokens',
      'Sin cancelaciones disponibles',
      'Sí, cancelar de todas formas',
    ],
    [
      'reagendada',
      'rescheduled_cancelled',
      '¿Cancelar la clase reagendada?',
      'Sí, cancelar',
    ],
  ] as const)(
    '%s: textos y un solo botón de confirmar',
    async (escenario, estadoFinal, titulo, confirmar) => {
      await montar(
        crearMemoriaClasesRepository(CLASES, {
          vistasPrevias: {
            f1: vista({ escenario, estadoFinal, descuentaToken: true }),
          },
        }),
      );
      await abrirHoja();
      expect(await screen.findByText(titulo)).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: confirmar })).toBeOnTheScreen();
      expect(screen.queryByTestId('cancelacion-soltar')).toBeNull();
    },
  );

  it('confirmar sin opciones cancela, avisa «cuenta como tomada» y vuelve a leer la lista', async () => {
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vista({}) },
    });
    const listar = jest.spyOn(base, 'listarClases');
    await montar(base);
    await abrirHoja();
    await fireEvent.press(await screen.findByTestId('cancelacion-confirmar'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-cancelacion')).toBeNull(),
    );
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: 'Clase cancelada · cuenta como tomada',
      }),
    );
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('con opciones: «Reagendar después» y «Soltarla»; la elegida viaja a Leap', async () => {
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: {
        f1: vista({
          escenario: 'power_elige',
          estadoFinal: 'cancelled_no_impact',
          tokensUsados: 1,
          tokensMaximos: 8,
          descuentaToken: true,
          opciones: [
            {
              opcion: 'reagendar',
              estado: 'cancelled_impacts_min',
              descuentaToken: true,
            },
            {
              opcion: 'soltar',
              estado: 'cancelled_no_impact',
              descuentaToken: true,
            },
          ],
        }),
      },
      cancelacion: { estadoFinal: 'to_reschedule' },
    });
    const cancelar = jest.spyOn(base, 'cancelarClase');
    await montar(base);
    await abrirHoja();
    expect(
      await screen.findByText('¿Qué quieres hacer con esta clase?'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Gasta 1 cancelación y no se recupera.'),
    ).toBeOnTheScreen();
    expect(screen.getByText(/te quedan 6 después/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('cancelacion-reagendar'));
    await waitFor(() =>
      expect(cancelar).toHaveBeenCalledWith({
        idClase: 'f1',
        opcion: 'reagendar',
      }),
    );
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'Clase cancelada · tienes 1 mes para reagendarla',
        }),
      ),
    );
  });

  it('soltar sin costo avisa «Clase cancelada»; el aviso de grupo se muestra', async () => {
    await montar(
      crearMemoriaClasesRepository(CLASES, {
        vistasPrevias: {
          f1: vista({
            escenario: 'elige',
            estadoFinal: 'cancelled_no_impact',
            enGrupo: true,
            opciones: [
              {
                opcion: 'reagendar',
                estado: 'cancelled_impacts_min',
                descuentaToken: true,
              },
              {
                opcion: 'soltar',
                estado: 'cancelled_no_impact',
                descuentaToken: false,
              },
            ],
          }),
        },
      }),
    );
    await abrirHoja();
    expect(
      await screen.findByText(
        'Estás en grupo: esta cancelación también afecta a tu compañero.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByText('No gasta tokens.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('cancelacion-soltar'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text1: 'Clase cancelada' }),
      ),
    );
  });

  it('un 409 al confirmar deja el error en la hoja y refresca la lista', async () => {
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vista({}) },
    });
    const repo: ClasesRepository = {
      ...base,
      cancelarClase: () =>
        Promise.resolve(respuestaError('Esta clase ya empezó.', 409)),
    };
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrirHoja();
    await fireEvent.press(await screen.findByTestId('cancelacion-confirmar'));
    expect(await screen.findByText('Esta clase ya empezó.')).toBeOnTheScreen();
    expect(screen.getByTestId('hoja-cancelacion')).toBeOnTheScreen();
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });

  it('otro error al confirmar deja la hoja abierta con el mensaje, sin refrescar', async () => {
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vista({}) },
    });
    const repo: ClasesRepository = {
      ...base,
      cancelarClase: () => Promise.resolve(respuestaError('Sin conexión', 0)),
    };
    const listar = jest.spyOn(repo, 'listarClases');
    await montar(repo);
    await abrirHoja();
    await fireEvent.press(await screen.findByTestId('cancelacion-confirmar'));
    expect(await screen.findByText('Sin conexión')).toBeOnTheScreen();
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('si Leap falla al revisar la clase: toast de error y la hoja no se queda abierta', async () => {
    const repo: ClasesRepository = {
      ...crearMemoriaClasesRepository(CLASES),
      vistaPreviaCancelacion: () =>
        Promise.resolve(respuestaError('Sin conexión', 0)),
    };
    await montar(repo);
    await fireEvent.press(screen.getByTestId('cancelar-f1'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'No se pudo cancelar la clase',
          text2: 'Sin conexión',
        }),
      ),
    );
    expect(screen.queryByTestId('hoja-cancelacion')).toBeNull();
  });

  it('«Volver» y el velo cierran; con la hoja ya cerrada, confirmar no hace nada', async () => {
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vista({}) },
    });
    const cancelar = jest.spyOn(base, 'cancelarClase');
    await montar(base);
    await abrirHoja();
    await fireEvent.press(await screen.findByTestId('cancelacion-volver'));
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-cancelacion')).toBeNull(),
    );
    await abrirHoja();
    await fireEvent.press(
      screen.getByTestId('velo-cancelacion', { includeHiddenElements: true }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-cancelacion')).toBeNull(),
    );
    expect(cancelar).not.toHaveBeenCalled();
  });

  it('un doble toque en confirmar manda una sola cancelación', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaClasesRepository(CLASES, {
      vistasPrevias: { f1: vista({}) },
    });
    const cancelar = jest.fn(
      () =>
        new Promise<
          ReturnType<ClasesRepository['cancelarClase']> extends Promise<infer R>
            ? R
            : never
        >(ok => {
          soltar = () =>
            ok(respuestaOk({ estadoFinal: 'cancelled_no_tokens' }));
        }),
    );
    await montar({ ...base, cancelarClase: cancelar });
    await abrirHoja();
    const boton = await screen.findByTestId('cancelacion-confirmar');
    // El primer toque queda pendiente (Leap aún no responde): no se espera.
    fireEvent.press(boton);
    fireEvent.press(boton);
    await waitFor(() => expect(cancelar).toHaveBeenCalled());
    expect(cancelar).toHaveBeenCalledTimes(1);
    soltar();
    await waitFor(() =>
      expect(screen.queryByTestId('hoja-cancelacion')).toBeNull(),
    );
  });
});
