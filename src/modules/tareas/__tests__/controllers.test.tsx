// F3-02: caminos de los controladores que la pantalla no recorre (desmontar a medias, errores, avance).
import { act, render, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  useGrabadora,
  useReproductor,
} from '@/modules/tareas/aplications/controllers/Audio.controller';
import { useMediaTarea } from '@/modules/tareas/aplications/controllers/Detalle.controller';
import { useTareasController } from '@/modules/tareas/aplications/controllers/Tareas.controller';
import {
  crearMemoriaTareasRepository,
  tareaDePrueba as tarea,
} from '@/modules/tareas/infrastructure/memoriaTareasRepository';
import type { AudioPort } from '@/native/ports/AudioPort';

const VOZ = 'data:audio/mp4;base64,QUJD';

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

function envoltorio(audio: AudioFalso, repo = crearMemoriaTareasRepository()) {
  const dependencias = crearDependenciasDePrueba({
    audio: audio as unknown as AudioPort,
    tareas: repo,
  });
  return ({ children }: { children: ReactNode }) => (
    <DependenciasProvider valor={dependencias}>{children}</DependenciasProvider>
  );
}

/**
 * Monta un hook dentro de un componente (con `render`, no `renderHook`: desmontar varios en una
 * misma prueba deja huérfano al siguiente).
 */
async function renderHook<T>(
  hook: () => T,
  {
    wrapper: Envoltorio,
  }: { wrapper: (p: { children: ReactNode }) => ReactNode },
) {
  const result = { current: null as unknown as T };
  function Sonda() {
    result.current = hook();
    return null;
  }
  const vista = await render(
    <Envoltorio>
      <Sonda />
    </Envoltorio>,
  );
  return { result, unmount: vista.unmount };
}

beforeEach(() => (Toast.show as jest.Mock).mockClear());

describe('useReproductor', () => {
  it('informa el avance, vuelve a reposo al terminar y conoce la duración', async () => {
    const audio = audioFalso();
    const { result } = await renderHook(() => useReproductor(VOZ, 'x', 4000), {
      wrapper: envoltorio(audio),
    });
    expect(result.current.estado.tipo).toBe('reposo');
    expect(result.current.duracionMs).toBe(4000);
    await act(async () => {
      await result.current._alternar();
    });
    expect(result.current.estado.tipo).toBe('reproduciendo');
    const opciones = audio.reproducir.mock.calls[0][1];
    await act(async () => opciones.alProgreso(1000, 8000));
    expect(result.current.progreso).toBeCloseTo(0.125);
    expect(result.current.duracionMs).toBe(8000);
    await act(async () => opciones.alTerminar());
    expect(result.current.estado.tipo).toBe('reposo');
    expect(result.current.progreso).toBe(0);
  });

  it('sin audio todavía no hace nada; con error avisa', async () => {
    const audio = audioFalso();
    const sin = await renderHook(() => useReproductor(null, 'x'), {
      wrapper: envoltorio(audio),
    });
    expect(sin.result.current.estado.tipo).toBe('cargando');
    await act(async () => {
      await sin.result.current._alternar();
    });
    expect(audio.reproducir).not.toHaveBeenCalled();

    audio.reproducir.mockResolvedValueOnce({ tipo: 'error', msg: 'rota' });
    const con = await renderHook(() => useReproductor(VOZ, 'y'), {
      wrapper: envoltorio(audio),
    });
    await act(async () => {
      await con.result.current._alternar();
    });
    expect(con.result.current.estado.tipo).toBe('reposo');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text2: 'rota' }),
    );
  });

  it('un audio que suena se detiene al salir; con otro tap, también', async () => {
    const audio = audioFalso();
    const { result, unmount } = await renderHook(
      () => useReproductor(VOZ, 'x'),
      { wrapper: envoltorio(audio) },
    );
    await act(async () => {
      await result.current._alternar();
    });
    await act(async () => {
      await result.current._alternar();
    });
    expect(audio.detener).toHaveBeenCalledTimes(1);
    await unmount();
    expect(audio.detener).toHaveBeenCalledTimes(2);
  });

  it('si se desmonta mientras suena, los avisos tardíos no rompen nada', async () => {
    const audio = audioFalso();
    const { result, unmount } = await renderHook(
      () => useReproductor(VOZ, 'x'),
      { wrapper: envoltorio(audio) },
    );
    await act(async () => {
      await result.current._alternar();
    });
    const opciones = audio.reproducir.mock.calls[0][1];
    await unmount();
    expect(() => {
      opciones.alProgreso(1, 2);
      opciones.alTerminar();
    }).not.toThrow();
  });
});

describe('useGrabadora', () => {
  it('terminar o cancelar sin grabar no hace nada; grabar dos veces graba una', async () => {
    const audio = audioFalso();
    const { result } = await renderHook(() => useGrabadora(), {
      wrapper: envoltorio(audio),
    });
    await act(async () => {
      await result.current._terminar();
      await result.current._cancelar();
    });
    expect(audio.terminarGrabacion).not.toHaveBeenCalled();
    expect(audio.cancelarGrabacion).not.toHaveBeenCalled();
    await act(async () => {
      await result.current._grabar();
      await result.current._grabar();
    });
    expect(audio.empezarGrabacion).toHaveBeenCalledTimes(1);
  });

  it('los avances que llegan sin grabar se ignoran', async () => {
    const audio = audioFalso();
    const { result } = await renderHook(() => useGrabadora(), {
      wrapper: envoltorio(audio),
    });
    await act(async () => {
      await result.current._grabar();
    });
    const progreso = audio.empezarGrabacion.mock.calls[0][0];
    await act(async () => {
      await result.current._cancelar();
    });
    await act(async () => progreso(3000));
    expect(result.current.grabacion.tipo).toBe('inactiva');
  });

  it('si se desmonta mientras empieza, no queda estado colgado', async () => {
    const audio = audioFalso();
    let soltarInicio: (r: { tipo: 'ok' }) => void = () => undefined;
    audio.empezarGrabacion.mockImplementationOnce(
      () => new Promise(r => (soltarInicio = r)),
    );
    const a = await renderHook(() => useGrabadora(), {
      wrapper: envoltorio(audio),
    });
    await act(async () => {
      a.result.current._grabar();
    });
    await a.unmount();
    await act(async () => soltarInicio({ tipo: 'ok' }));
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('si se desmonta mientras termina, el resultado tardío se ignora', async () => {
    const audio = audioFalso();
    let soltarFin: (r: unknown) => void = () => undefined;
    audio.terminarGrabacion.mockImplementationOnce(
      () => new Promise(r => (soltarFin = r)),
    );
    const b = await renderHook(() => useGrabadora(), {
      wrapper: envoltorio(audio),
    });
    await act(async () => {
      await b.result.current._grabar();
    });
    await act(async () => {
      b.result.current._terminar();
    });
    await b.unmount();
    await act(async () =>
      soltarFin({ tipo: 'ok', dataUrl: VOZ, duracionMs: 5000 }),
    );
    expect(Toast.show).not.toHaveBeenCalled();
  });
});

describe('useMediaTarea', () => {
  it('si se desmonta antes de que llegue el contenido, no actualiza', async () => {
    const repo = crearMemoriaTareasRepository();
    let soltar: (r: unknown) => void = () => undefined;
    jest
      .spyOn(repo, 'media')
      .mockImplementationOnce(() => new Promise(r => (soltar = r)) as never);
    const { result, unmount } = await renderHook(
      () => useMediaTarea(1, 'entrega', true),
      { wrapper: envoltorio(audioFalso(), repo) },
    );
    expect(result.current.estado.tipo).toBe('cargando');
    await unmount();
    await act(async () =>
      soltar({ error: false, response: { voz: null, imagenes: [] } }),
    );
  });
});

describe('useTareasController', () => {
  it('un fallo al refrescar conserva la lista; un error de carga sin mensaje queda vacío', async () => {
    const repo = crearMemoriaTareasRepository({ tareas: [tarea()] });
    const { result } = await renderHook(
      () => useTareasController('estudiante'),
      {
        wrapper: envoltorio(audioFalso(), repo),
      },
    );
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    jest
      .spyOn(repo, 'listar')
      .mockResolvedValueOnce({ error: true, msg: 'sin red' });
    await act(async () => {
      await result.current._refrescar();
    });
    expect(result.current.estado.tipo).toBe('listo');
    expect(result.current.refrescando).toBe(false);
    jest
      .spyOn(repo, 'listar')
      .mockResolvedValueOnce({ error: false, response: undefined });
    await act(async () => {
      await result.current._cargar();
    });
    expect(result.current.estado).toEqual({ tipo: 'error', msg: '' });
  });

  it('si se desmonta mientras carga o refresca, no actualiza', async () => {
    const repo = crearMemoriaTareasRepository({ tareas: [tarea()] });
    let soltar: (r: unknown) => void = () => undefined;
    jest
      .spyOn(repo, 'listar')
      .mockImplementation(() => new Promise(r => (soltar = r)) as never);
    const { result, unmount } = await renderHook(
      () => useTareasController('profe'),
      { wrapper: envoltorio(audioFalso(), repo) },
    );
    await act(async () => {
      result.current._refrescar();
    });
    await unmount();
    await act(async () => soltar({ error: true, msg: 'x' }));
  });
});
