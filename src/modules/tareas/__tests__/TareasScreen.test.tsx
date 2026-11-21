// F3-02 (3.7–3.10): lista, detalle, entrega con texto y voz, feedback y revisión de la profe.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { IResponseTarea } from '@/modules/tareas/domain/entities/Tareas.entities';
import {
  crearMemoriaTareasRepository,
  tareaDePrueba as tarea,
} from '@/modules/tareas/infrastructure/memoriaTareasRepository';
import { TareasScreen } from '@/modules/tareas/presentation/screens/TareasScreen';
import type { AudioPort } from '@/native/ports/AudioPort';
import { TemaProvider } from '@/shared/theme';

const VOZ = 'data:audio/mp4;base64,QUJD';
const AHORA = Date.UTC(2026, 10, 23, 15, 0);

type AudioFalso = { [K in keyof AudioPort]: jest.Mock };
function audioFalso(): AudioFalso {
  return {
    empezarGrabacion: jest.fn().mockResolvedValue({ tipo: 'ok' }),
    terminarGrabacion: jest
      .fn()
      .mockResolvedValue({ tipo: 'ok', dataUrl: VOZ, duracionMs: 5000 }),
    cancelarGrabacion: jest.fn().mockResolvedValue(undefined),
    reproducir: jest.fn().mockResolvedValue({ tipo: 'ok' }),
    detener: jest.fn().mockResolvedValue(undefined),
  };
}

async function montar(
  tareas: IResponseTarea[],
  rol: 'estudiante' | 'profe' = 'estudiante',
  extra: {
    audio?: AudioFalso;
    repo?: ReturnType<typeof crearMemoriaTareasRepository>;
    alCambiarPendientes?: (n: number) => void;
  } = {},
) {
  jest.spyOn(Date, 'now').mockReturnValue(AHORA);
  const repo = extra.repo ?? crearMemoriaTareasRepository({ tareas });
  const audio = extra.audio ?? audioFalso();
  const dependencias = crearDependenciasDePrueba({
    tareas: repo,
    audio: audio as unknown as AudioPort,
  });
  const Envoltorio = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          {children}
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
  await render(
    <Envoltorio>
      <TareasScreen rol={rol} alCambiarPendientes={extra.alCambiarPendientes} />
    </Envoltorio>,
  );
  return { repo, audio };
}

beforeEach(() => (Toast.show as jest.Mock).mockClear());
afterEach(() => jest.restoreAllMocks());

describe('lista (3.7)', () => {
  it('el estudiante entra en «Pendientes», con su orden, vencidas marcadas y los conteos', async () => {
    const cambiar = jest.fn();
    await montar(
      [
        tarea({ id: 1, titulo: 'Tarde', vence: '2026-12-01' }),
        tarea({ id: 2, titulo: 'Atrasada', vence: '2026-11-20' }),
        tarea({ id: 3, titulo: 'En revisión', estado: 'ready_review' }),
        tarea({ id: 4, titulo: 'Corregida', estado: 'reviewed', nota: '9' }),
      ],
      'estudiante',
      { alCambiarPendientes: cambiar },
    );
    expect(await screen.findByTestId('tareas-lista')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Pendientes, 2' })).toBeSelected();
    expect(
      screen.getByRole('tab', { name: 'Por revisar, 1' }),
    ).toBeOnTheScreen();
    const ids = screen.getAllByTestId(/^tarea-\d+$/).map(n => n.props.testID);
    expect(ids).toEqual(['tarea-2', 'tarea-1']);
    expect(
      screen.getByText('Vencida', { exact: true, hidden: true }),
    ).toBeOnTheScreen();
    expect(cambiar).toHaveBeenLastCalledWith(2);
  });

  it('cambia de sección y muestra el vacío cuando no hay nada', async () => {
    await montar([tarea({ id: 1 })]);
    await screen.findByTestId('tarea-1');
    await fireEvent.press(screen.getByTestId('tareas-seccion-revisadas'));
    expect(screen.getByTestId('tareas-vacio')).toHaveTextContent(
      'Aún no hay tareas revisadas.',
    );
  });

  it('la profe entra en «Por revisar», ve el nombre del estudiante y cuenta lo por revisar', async () => {
    const cambiar = jest.fn();
    await montar(
      [
        tarea({ id: 1, estado: 'ready_review', estudiante: 'Luis Pérez' }),
        tarea({ id: 2 }),
      ],
      'profe',
      { alCambiarPendientes: cambiar },
    );
    expect(await screen.findByTestId('tarea-1')).toBeOnTheScreen();
    expect(screen.getByText('Luis Pérez')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Por revisar, 1' })).toBeSelected();
    expect(cambiar).toHaveBeenLastCalledWith(1);
    await fireEvent.press(screen.getByTestId('tareas-seccion-pendientes'));
    expect(screen.queryByTestId('tarea-1')).toBeNull();
    expect(screen.getByTestId('tarea-2')).toBeOnTheScreen();
  });

  it('sin tareas por revisar, la profe lo lee claro', async () => {
    await montar([], 'profe');
    expect(await screen.findByTestId('tareas-vacio')).toHaveTextContent(
      'No hay entregas por revisar.',
    );
    await fireEvent.press(screen.getByTestId('tareas-seccion-pendientes'));
    expect(screen.getByTestId('tareas-vacio')).toHaveTextContent(
      'Ningún estudiante tiene tareas pendientes.',
    );
  });

  it('un error de carga se puede reintentar', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [tarea()],
      falla: { listar: { msg: 'Sin conexión' } },
    });
    await montar([], 'estudiante', { repo });
    expect(await screen.findByTestId('tareas-error')).toBeOnTheScreen();
    expect(screen.getByText('Sin conexión')).toBeOnTheScreen();
  });
});

describe('entrega del estudiante (3.8)', () => {
  it('escribe su respuesta y la envía: la tarea pasa a «Por revisar»', async () => {
    const { repo } = await montar([
      tarea({ id: 1, instruccion: 'Cuéntame tu día' }),
    ]);
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(await screen.findByTestId('tarea-detalle')).toBeOnTheScreen();
    expect(screen.getByText('Cuéntame tu día')).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByTestId('tarea-respuesta'),
      'I wake up at six.',
    );
    await fireEvent.press(screen.getByTestId('tarea-enviar'));
    await waitFor(() => expect(repo.entregas).toHaveLength(1));
    expect(repo.entregas[0]).toMatchObject({
      id: 1,
      texto: 'I wake up at six.',
    });
    expect(await screen.findByText('Enviar de nuevo')).toBeOnTheScreen();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Entrega enviada' }),
    );
  });

  it('graba un audio, lo escucha y lo envía con la respuesta', async () => {
    const audio = audioFalso();
    const { repo } = await montar([tarea({ id: 1 })], 'estudiante', { audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar'));
    expect(await screen.findByTestId('tarea-grabando')).toBeOnTheScreen();
    (audio.empezarGrabacion.mock.calls[0][0] as (ms: number) => void)(7400);
    expect(await screen.findByText('Grabando 0:07')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('tarea-grabar-terminar'));
    expect(await screen.findByTestId('tarea-audio-listo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('tarea-audio-previa-alternar'));
    expect(audio.reproducir).toHaveBeenCalledWith(VOZ, expect.any(Object));
    await fireEvent.press(screen.getByTestId('tarea-enviar'));
    await waitFor(() => expect(repo.entregas).toHaveLength(1));
    expect(repo.entregas[0]).toMatchObject({ id: 1, texto: '', voz: VOZ });
    expect(screen.queryByTestId('tarea-audio-listo')).toBeNull();
  });

  it('cancelar y descartar quitan la grabación; sin micrófono avisa', async () => {
    const audio = audioFalso();
    await montar([tarea({ id: 1 })], 'estudiante', { audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar-cancelar'));
    expect(audio.cancelarGrabacion).toHaveBeenCalled();
    expect(await screen.findByTestId('tarea-grabar')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('tarea-grabar'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar-terminar'));
    await fireEvent.press(await screen.findByTestId('tarea-audio-descartar'));
    expect(screen.queryByTestId('tarea-audio-listo')).toBeNull();

    audio.empezarGrabacion.mockResolvedValueOnce({ tipo: 'denegado' });
    await fireEvent.press(screen.getByTestId('tarea-grabar'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: expect.stringContaining('micrófono'),
        }),
      ),
    );
    expect(screen.getByTestId('tarea-grabar')).toBeOnTheScreen();
  });

  it('una grabación muy corta, con error o demasiado larga no queda lista', async () => {
    const audio = audioFalso();
    await montar([tarea({ id: 1 })], 'estudiante', { audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    for (const r of [
      { tipo: 'ok', dataUrl: VOZ, duracionMs: 100 },
      { tipo: 'error', msg: 'fallo' },
      { tipo: 'ok', dataUrl: 'x'.repeat(3000001), duracionMs: 5000 },
    ]) {
      audio.terminarGrabacion.mockResolvedValueOnce(r);
      await fireEvent.press(await screen.findByTestId('tarea-grabar'));
      await fireEvent.press(await screen.findByTestId('tarea-grabar-terminar'));
      await waitFor(() =>
        expect(screen.getByTestId('tarea-grabar')).toBeOnTheScreen(),
      );
    }
    expect(screen.queryByTestId('tarea-audio-listo')).toBeNull();
  });

  it('a los 2 minutos la grabación se corta sola', async () => {
    const audio = audioFalso();
    await montar([tarea({ id: 1 })], 'estudiante', { audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar'));
    await screen.findByTestId('tarea-grabando');
    (audio.empezarGrabacion.mock.calls[0][0] as (ms: number) => void)(120000);
    expect(await screen.findByTestId('tarea-audio-listo')).toBeOnTheScreen();
  });

  it('si el envío falla avisa y deja el texto para reintentar', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [tarea({ id: 1 })],
      falla: { entregar: { msg: 'Esta tarea ya fue revisada.' } },
    });
    await montar([], 'estudiante', { repo });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.changeText(
      await screen.findByTestId('tarea-respuesta'),
      'Hola',
    );
    await fireEvent.press(screen.getByTestId('tarea-enviar'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: 'Esta tarea ya fue revisada.' }),
      ),
    );
    expect(screen.getByTestId('tarea-respuesta').props.value).toBe('Hola');
  });

  it('enviar sin nada avisa y no llama a Leap', async () => {
    const { repo } = await montar([tarea({ id: 1 })]);
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-enviar'));
    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: expect.stringContaining('graba un audio'),
        }),
      ),
    );
    expect(repo.entregas).toEqual([]);
  });

  it('una grabación abierta se descarta al salir', async () => {
    const audio = audioFalso();
    await montar([tarea({ id: 1 })], 'estudiante', { audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar'));
    await screen.findByTestId('tarea-grabando');
    await fireEvent.press(screen.getByTestId('tarea-volver'));
    expect(audio.cancelarGrabacion).toHaveBeenCalled();
  });
});

describe('detalle y feedback (3.7, 3.9)', () => {
  it('muestra la consigna con su audio e imágenes, bajados bajo demanda', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [
        tarea({
          id: 1,
          tieneVozInstruccion: true,
          imagenesInstruccion: 1,
          archivos: 2,
        }),
      ],
      media: {
        '1:instruccion': { voz: VOZ, imagenes: ['data:image/png;base64,QQ=='] },
      },
    });
    const audio = audioFalso();
    await montar([], 'estudiante', { repo, audio });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(
      await screen.findByTestId('tarea-media-instruccion'),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Imagen 1')).toBeOnTheScreen();
    expect(
      screen.getByText('2 PDF adjuntos: ábrelos desde la web.'),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByTestId('tarea-media-instruccion-voz-alternar'),
    );
    expect(audio.reproducir).toHaveBeenCalledWith(VOZ, expect.any(Object));
    // Suena y se detiene con el mismo botón.
    await fireEvent.press(
      screen.getByTestId('tarea-media-instruccion-voz-alternar'),
    );
    expect(audio.detener).toHaveBeenCalled();
  });

  it('si el contenido no baja, ofrece reintentar', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [tarea({ id: 1, imagenesInstruccion: 1 })],
      falla: { media: { msg: 'sin red' } },
    });
    await montar([], 'estudiante', { repo });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(
      await screen.findByTestId('tarea-media-instruccion-reintentar'),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByTestId('tarea-media-instruccion-reintentar'),
    );
    expect(
      await screen.findByTestId('tarea-media-instruccion-reintentar'),
    ).toBeOnTheScreen();
  });

  it('el estudiante ve el feedback de su profe y queda marcado como visto', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [
        tarea({
          id: 1,
          estado: 'reviewed',
          entrega: 'I wake up at six.',
          comentario: 'Muy bien, cuida los verbos.',
          nota: '9',
          tieneVozFeedback: true,
        }),
      ],
      media: { '1:feedback': { voz: VOZ, imagenes: [] } },
    });
    await montar([], 'estudiante', { repo });
    await fireEvent.press(
      await screen.findByTestId('tareas-seccion-revisadas'),
    );
    expect(await screen.findByText('Feedback nuevo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('tarea-1'));
    expect(
      await screen.findByText('Muy bien, cuida los verbos.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('I wake up at six.')).toBeOnTheScreen();
    expect(await screen.findByTestId('tarea-media-feedback')).toBeOnTheScreen();
    await waitFor(() => expect(repo.vistos).toEqual([1]));
    // Revisada: ya no hay formulario para entregar.
    expect(screen.queryByTestId('tarea-formulario-entrega')).toBeNull();
  });

  it('el atrás de Android cierra el detalle', async () => {
    let atras: (() => boolean) | undefined;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, h) => {
      atras = h as () => boolean;
      return { remove: jest.fn() };
    });
    await montar([tarea({ id: 1 })]);
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await screen.findByTestId('tarea-detalle');
    expect(atras?.()).toBe(true);
    expect(await screen.findByTestId('tareas-lista')).toBeOnTheScreen();
  });
});

describe('revisión de la profe (3.10)', () => {
  it('ve la entrega y manda comentario y nota; la tarea pasa a «Revisadas»', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [
        tarea({
          id: 1,
          estado: 'ready_review',
          estudiante: 'Luis Pérez',
          entrega: 'Mi respuesta',
        }),
      ],
    });
    await montar([], 'profe', { repo });
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(await screen.findByText('Entrega de Luis Pérez')).toBeOnTheScreen();
    expect(screen.getByText('Mi respuesta')).toBeOnTheScreen();
    await fireEvent.changeText(
      screen.getByTestId('tarea-comentario'),
      'Buen trabajo',
    );
    await fireEvent.changeText(screen.getByTestId('tarea-nota'), '10');
    await fireEvent.press(screen.getByTestId('tarea-enviar'));
    await waitFor(() => expect(repo.revisiones).toHaveLength(1));
    expect(repo.revisiones[0]).toMatchObject({
      id: 1,
      comentario: 'Buen trabajo',
      nota: '10',
    });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: 'Feedback enviado' }),
    );
  });

  it('con el feedback ya dado, el formulario queda cerrado hasta «Editar feedback»', async () => {
    await montar(
      [
        tarea({
          id: 1,
          estado: 'reviewed',
          entrega: 'Mi respuesta',
          comentario: 'Muy bien',
          nota: '9',
        }),
      ],
      'profe',
    );
    await fireEvent.press(
      await screen.findByTestId('tareas-seccion-revisadas'),
    );
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(await screen.findByTestId('tarea-feedback')).toBeOnTheScreen();
    expect(screen.queryByTestId('tarea-comentario')).toBeNull();
    await fireEvent.press(screen.getByTestId('tarea-editar-feedback'));
    expect(screen.getByTestId('tarea-comentario')).toBeOnTheScreen();
    expect(screen.queryByTestId('tarea-editar-feedback')).toBeNull();
  });

  it('con una tarea sin entregar no hay formulario de feedback', async () => {
    await montar([tarea({ id: 1, estado: 'pending' })], 'profe');
    await fireEvent.press(
      await screen.findByTestId('tareas-seccion-pendientes'),
    );
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    expect(
      await screen.findByText('Todavía no hay entrega.'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('tarea-formulario-feedback')).toBeNull();
  });

  it('puede grabar un audio de feedback', async () => {
    const audio = audioFalso();
    const { repo } = await montar(
      [tarea({ id: 1, estado: 'ready_review' })],
      'profe',
      { audio },
    );
    await fireEvent.press(await screen.findByTestId('tarea-1'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar'));
    await fireEvent.press(await screen.findByTestId('tarea-grabar-terminar'));
    await screen.findByTestId('tarea-audio-listo');
    await fireEvent.press(screen.getByTestId('tarea-enviar'));
    await waitFor(() => expect(repo.revisiones).toHaveLength(1));
    expect(repo.revisiones[0]).toMatchObject({
      comentario: '',
      nota: '',
      voz: VOZ,
    });
  });
});
