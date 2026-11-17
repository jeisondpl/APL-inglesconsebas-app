// F1-07: controller del inicio del profe: carga, error genérico, reintentar, refresco fallido con
// datos, reloj, Zoom que no abre y «Marcar».
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Toast from 'react-native-toast-message';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { INTERVALO_RELOJ_MS } from '@/modules/inicio/aplications/controllers/Inicio.controller';
import { useInicioProfeController } from '@/modules/inicio/aplications/controllers/InicioProfe.controller';
import { mensajesInicio } from '@/modules/inicio/domain/inicio.mensajes';
import type { InicioProfeRepository } from '@/modules/inicio/domain/models/InicioProfeRepository';
import { crearMemoriaInicioProfeRepository } from '@/modules/inicio/infrastructure/memoriaInicioProfeRepository';
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

const repoQueFalla = (falla: () => Promise<unknown>): InicioProfeRepository =>
  ({
    listarClases: falla,
    listarEstudiantes: falla,
    listarAsistenciasPendientes: falla,
    listarTareas: falla,
    contarNoLeidos: falla,
  } as unknown as InicioProfeRepository);

async function montar(
  repo: InicioProfeRepository = crearMemoriaInicioProfeRepository({
    noLeidos: 5,
  }),
  enlaces = { abrir: jest.fn(() => Promise.resolve(true)) },
  ahora: () => number = () => AHORA,
) {
  const alCambiarNoLeidos = jest.fn();
  const dependencias = crearDependenciasDePrueba({
    inicioProfe: repo,
    enlaces,
  });
  const r = await renderHook(
    () => useInicioProfeController({ idProfe: 't1', alCambiarNoLeidos, ahora }),
    { wrapper: envoltorio(dependencias) },
  );
  return { ...r, enlaces, alCambiarNoLeidos };
}

beforeEach(() => (Toast.show as jest.Mock).mockClear());

describe('useInicioProfeController', () => {
  it('carga la vista y avisa los no leídos', async () => {
    const { result, alCambiarNoLeidos } = await montar();
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    expect(alCambiarNoLeidos).toHaveBeenCalledWith(5);
  });

  it('error sin mensaje → genérico; «Reintentar» vuelve a cargar', async () => {
    const repo = repoQueFalla(() => Promise.resolve({ error: true }));
    const { result } = await montar(repo);
    await waitFor(() =>
      expect(result.current.estado).toEqual({
        tipo: 'error',
        msg: 'Ocurrió un error inesperado.',
      }),
    );
    Object.assign(repo, crearMemoriaInicioProfeRepository());
    await act(async () => result.current._cargar());
    expect(result.current.estado.tipo).toBe('listo');
  });

  it('un refresco fallido conserva lo que se ve y avisa con un toast', async () => {
    const repo = crearMemoriaInicioProfeRepository();
    const { result } = await montar(repo);
    await waitFor(() => expect(result.current.estado.tipo).toBe('listo'));
    Object.assign(
      repo,
      repoQueFalla(() => Promise.resolve(respuestaError('Sin red', 0))),
    );
    await act(async () => result.current._refrescar());
    expect(result.current.estado.tipo).toBe('listo');
    expect(result.current.refrescando).toBe(false);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: mensajesInicio.noSeActualizo }),
    );
  });

  it('el reloj avanza cada minuto', async () => {
    jest.useFakeTimers();
    let ahora = AHORA;
    const { result } = await montar(undefined, undefined, () => ahora);
    await act(async () => {});
    ahora += INTERVALO_RELOJ_MS;
    await act(async () => {
      jest.advanceTimersByTime(INTERVALO_RELOJ_MS);
    });
    expect(result.current.ahoraMs).toBe(AHORA + INTERVALO_RELOJ_MS);
    jest.useRealTimers();
  });

  it('Zoom: abre el enlace y avisa si no se pudo', async () => {
    const enlaces = { abrir: jest.fn(() => Promise.resolve(false)) };
    const { result } = await montar(undefined, enlaces);
    await act(async () => result.current._abrirClase('https://zoom'));
    expect(enlaces.abrir).toHaveBeenCalledWith('https://zoom');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text1: mensajesInicio.noSeAbrioClase }),
    );
  });

  it('«Marcar» avisa que llega pronto', async () => {
    const { result } = await montar();
    act(() => result.current._marcarAsistencia());
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: mensajesInicio.proximamente,
        text2: mensajesInicio.asistenciaProximamente,
      }),
    );
  });

  it('una carga que llega después de desmontar no actualiza nada', async () => {
    let soltar: () => void = () => {};
    const base = crearMemoriaInicioProfeRepository();
    const repo: InicioProfeRepository = {
      ...base,
      listarClases: () =>
        new Promise(ok => {
          soltar = () => ok(base.listarClases() as never);
        }).then(() => base.listarClases()),
    };
    const { unmount } = await montar(repo);
    unmount();
    await act(async () => soltar());
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
