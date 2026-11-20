// F1-05: controller del inicio (CA9, CA13): carga, error, reintentar, refrescar, reloj, Zoom y
// reagendar.
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  INTERVALO_RELOJ_MS,
  useInicioController,
  type IOpcionesInicioController,
} from '@/modules/inicio/aplications/controllers/Inicio.controller';
import { mensajesInicio } from '@/modules/inicio/domain/inicio.mensajes';
import type { InicioRepository } from '@/modules/inicio/domain/models/InicioRepository';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import { respuestaError } from '@/shared/lib/HttpResponse';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

const todoFalla = (): InicioRepository => {
  const falla = () => Promise.resolve(respuestaError<never>('Sin red', 0));
  return {
    obtenerPlan: falla,
    listarClases: falla,
    listarHorario: falla,
    listarTareas: falla,
    contarNoLeidos: falla,
    listarMensajes: falla,
  };
};

async function montar(
  inicio: InicioRepository = crearMemoriaInicioRepository(),
  opciones: Partial<IOpcionesInicioController> = {},
  enlaces = { abrir: jest.fn(() => Promise.resolve(true)) },
) {
  const dependencias = crearDependenciasDePrueba({ inicio, enlaces });
  const r = await renderHook(
    () =>
      useInicioController({
        idEstudiante: 's1',
        ahora: () => AHORA,
        ...opciones,
      }),
    { wrapper: envoltorio(dependencias) },
  );
  return { ...r, enlaces };
}

beforeEach(() => (Toast.show as jest.Mock).mockClear());

describe('useInicioController', () => {
  it('empieza cargando y pasa a listo con la vista y los no leídos', async () => {
    const alCambiarNoLeidos = jest.fn();
    let resolver: () => void = () => {};
    const base = crearMemoriaInicioRepository({ noLeidos: 3 });
    const repo: InicioRepository = {
      ...base,
      obtenerPlan: () =>
        new Promise(ok => {
          resolver = () => ok(base.obtenerPlan() as never);
        }).then(() => base.obtenerPlan()),
    };
    const { result } = await montar(repo, { alCambiarNoLeidos });
    expect(result.current.estado).toEqual({ tipo: 'cargando' });
    await act(async () => resolver());
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(result.current.ahoraMs).toBe(AHORA);
    expect(alCambiarNoLeidos).toHaveBeenCalledWith(3);
  });

  it('si falla todo queda en error y «Reintentar» vuelve a cargar', async () => {
    const repo = todoFalla();
    const { result } = await montar(repo);
    await waitFor(() =>
      expect(result.current.estado).toEqual({ tipo: 'error', msg: 'Sin red' }),
    );
    Object.assign(repo, crearMemoriaInicioRepository());
    await act(async () => result.current._cargar());
    expect(result.current.estado.tipo).toBe('listo');
  });

  it('un error sin mensaje usa el genérico', async () => {
    const vacio = () => Promise.resolve({ error: true });
    const repo = {
      obtenerPlan: vacio,
      listarClases: vacio,
      listarHorario: vacio,
      listarTareas: vacio,
      contarNoLeidos: vacio,
      listarMensajes: vacio,
    } as unknown as InicioRepository;
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('error'));
    expect(result.current.estado).toEqual({
      tipo: 'error',
      msg: 'Ocurrió un error inesperado.',
    });
  });

  it('refrescar con datos: si falla conserva lo que había y avisa con un toast', async () => {
    const repo = { ...crearMemoriaInicioRepository() };
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    Object.assign(repo, todoFalla());
    await act(async () => result.current._refrescar());
    expect(result.current.estado.tipo).toBe('listo');
    expect(result.current.refrescando).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: mensajesInicio.noSeActualizo,
      text2: 'Sin red',
    });
  });

  it('refrescar con éxito actualiza la vista', async () => {
    const repo = { ...crearMemoriaInicioRepository() };
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    Object.assign(repo, crearMemoriaInicioRepository({ noLeidos: 5 }));
    await act(async () => result.current._refrescar());
    const estado = result.current.estado;
    expect(estado.tipo === 'listo' && estado.vista.noLeidos).toBe(5);
  });

  it('una carga vieja no pisa a la nueva', async () => {
    let primera = true;
    const base = crearMemoriaInicioRepository();
    const repo: InicioRepository = {
      ...base,
      contarNoLeidos: async args => {
        if (primera) {
          primera = false;
          await new Promise(ok => setTimeout(ok, 20));
          return base.contarNoLeidos(args).then(r => ({ ...r, response: 9 }));
        }
        return base.contarNoLeidos(args).then(r => ({ ...r, response: 1 }));
      },
    };
    const { result } = await montar(repo);
    await act(async () => result.current._cargar());
    await act(async () => new Promise(ok => setTimeout(ok, 40)));
    const estado = result.current.estado;
    expect(estado.tipo === 'listo' && estado.vista.noLeidos).toBe(1);
  });

  it('el reloj recalcula la cuenta atrás cada minuto', async () => {
    jest.useFakeTimers();
    try {
      let ahora = AHORA;
      const { result } = await montar(undefined, { ahora: () => ahora });
      await act(async () => {
        await Promise.resolve();
      });
      ahora = AHORA + INTERVALO_RELOJ_MS;
      await act(async () => {
        jest.advanceTimersByTime(INTERVALO_RELOJ_MS);
      });
      expect(result.current.ahoraMs).toBe(AHORA + INTERVALO_RELOJ_MS);
    } finally {
      jest.useRealTimers();
    }
  });

  it('_abrirClase abre el enlace con EnlacesPort; si falla, avisa', async () => {
    const enlaces = { abrir: jest.fn(() => Promise.resolve(true)) };
    const { result } = await montar(undefined, {}, enlaces);
    await act(async () => result.current._abrirClase('https://zoom.us/j/1'));
    expect(enlaces.abrir).toHaveBeenCalledWith('https://zoom.us/j/1');
    expect(Toast.show).not.toHaveBeenCalled();
    enlaces.abrir.mockResolvedValueOnce(false);
    await act(async () => result.current._abrirClase('https://zoom.us/j/1'));
    expect(Toast.show).toHaveBeenCalledWith({
      type: 'error',
      text1: mensajesInicio.noSeAbrioClase,
      text2: mensajesInicio.noSeAbrioClaseDetalle,
    });
  });

  it('desmontado durante la carga no actualiza el estado', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaInicioRepository();
    const repo: InicioRepository = {
      ...base,
      listarTareas: args =>
        new Promise(ok => {
          soltar = () => ok(base.listarTareas(args) as never);
        }).then(() => base.listarTareas(args)),
    };
    const { result, unmount } = await montar(repo);
    await unmount();
    await act(async () => soltar());
    expect(result.current.estado).toEqual({ tipo: 'cargando' });
  });
});
