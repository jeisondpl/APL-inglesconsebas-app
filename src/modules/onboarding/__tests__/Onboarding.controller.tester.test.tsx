// Tester (EXT-01): casos de error y de borde del controller y de los casos de uso.
// CA4 (sesión que aparece después, sesión con la bandera ya vista), CA9 (doble cierre por
// «Comenzar» en el mismo tick, cierre tras otro cierre), CA10 (guardado que devuelve `false` o que
// tarda) y el error claro si el contenedor no trae la bandera.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
  type IAlmacenEnMemoria,
} from '@/app/di/dependenciasDePrueba';
import { arrancarOnboardingUseCase } from '@/modules/onboarding/aplications/arrancarOnboarding/arrancarOnboarding';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import {
  useArranqueOnboarding,
  useOnboardingController,
} from '@/modules/onboarding/aplications/controllers/Onboarding.controller';
import { marcarOnboardingVistoUseCase } from '@/modules/onboarding/aplications/marcarOnboardingVisto/marcarOnboardingVisto';
import type { EstadoOnboarding } from '@/modules/onboarding/domain/entities/Onboarding.entities';

const CLAVE = 'hasSeenOnboarding';

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

function dependenciasCon(
  almacen: IAlmacenEnMemoria,
  onboardingInicial: EstadoOnboarding,
) {
  return crearDependenciasDePrueba({ almacen, onboardingInicial });
}

const guardadosDeBandera = (guardar: jest.SpyInstance) =>
  guardar.mock.calls.filter(([clave]) => clave === CLAVE).length;

describe('useArranqueOnboarding: casos de borde (CA2, CA4, CA11)', () => {
  it('con sesión y la bandera ya vista no vuelve a guardarla', async () => {
    const almacen = crearAlmacenEnMemoria({ [CLAVE]: '1' });
    const guardar = jest.spyOn(almacen, 'guardar');
    const dependencias = dependenciasCon(almacen, { tipo: 'cargando' });
    const { result } = await renderHook(() => useArranqueOnboarding(true), {
      wrapper: envoltorio(dependencias),
    });
    expect(result.current).toEqual({ tipo: 'visto' });
    expect(guardar).not.toHaveBeenCalled();
  });

  it('si la sesión aparece después (pasa a true) con la bandera pendiente, la marca (CA4)', async () => {
    const almacen = crearAlmacenEnMemoria();
    const dependencias = dependenciasCon(almacen, { tipo: 'cargando' });
    const { result, rerender } = await renderHook(
      ({ haySesion }: { haySesion: boolean }) =>
        useArranqueOnboarding(haySesion),
      {
        wrapper: envoltorio(dependencias),
        initialProps: { haySesion: false },
      },
    );
    expect(result.current).toEqual({ tipo: 'pendiente' });
    expect(almacen.datos.has(CLAVE)).toBe(false);
    await rerender({ haySesion: true });
    expect(result.current).toEqual({ tipo: 'visto' });
    expect(almacen.datos.get(CLAVE)).toBe('1');
  });

  it('sin sesión y con la bandera pendiente no guarda nada (la bienvenida decide)', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const dependencias = dependenciasCon(almacen, { tipo: 'cargando' });
    await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    expect(guardar).not.toHaveBeenCalled();
  });

  it('mientras la lectura no resuelve sigue en cargando (el navegador no pinta)', async () => {
    let resolver: (v: string | null) => void = () => {};
    const base = crearAlmacenEnMemoria();
    const almacen: IAlmacenEnMemoria = {
      ...base,
      leer: () =>
        new Promise(r => {
          resolver = r;
        }),
    };
    const dependencias = dependenciasCon(almacen, { tipo: 'cargando' });
    const { result } = await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    expect(result.current).toEqual({ tipo: 'cargando' });
    await act(async () => resolver('1'));
    expect(result.current).toEqual({ tipo: 'visto' });
  });

  it('dos montajes sobre la misma bandera solo leen el almacén una vez', async () => {
    const almacen = crearAlmacenEnMemoria();
    const leer = jest.spyOn(almacen, 'leer');
    const dependencias = dependenciasCon(almacen, { tipo: 'cargando' });
    const primero = await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    await primero.unmount();
    await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    expect(leer).toHaveBeenCalledTimes(1);
  });

  it('sin `banderaOnboarding` en el contenedor lanza un error claro', async () => {
    const dependencias = {
      ...crearDependenciasDePrueba(),
      banderaOnboarding: undefined,
    } as unknown as IDependencias;
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        renderHook(() => useArranqueOnboarding(false), {
          wrapper: envoltorio(dependencias),
        }),
      ).rejects.toThrow(/banderaOnboarding/);
    } finally {
      consola.mockRestore();
    }
  });
});

describe('useOnboardingController: cierre (CA9, CA10)', () => {
  async function montar(almacen: IAlmacenEnMemoria) {
    const dependencias = dependenciasCon(almacen, { tipo: 'pendiente' });
    const r = await renderHook(() => useOnboardingController(), {
      wrapper: envoltorio(dependencias),
    });
    return { ...r, dependencias };
  }

  it('«Comenzar» doble en el mismo tick (dos _siguiente en la última) guarda una sola vez', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const { result } = await montar(almacen);
    await act(async () => result.current._alDesplazar(3000, 750));
    expect(result.current.esUltima).toBe(true);
    await act(async () => {
      result.current._siguiente();
      result.current._siguiente();
    });
    expect(guardadosDeBandera(guardar)).toBe(1);
  });

  it('«Omitir» y luego «Comenzar» guarda una sola vez', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const { result } = await montar(almacen);
    await act(async () => result.current._alDesplazar(3000, 750));
    await act(async () => {
      result.current._terminar();
    });
    await act(async () => {
      result.current._siguiente();
    });
    expect(guardadosDeBandera(guardar)).toBe(1);
  });

  it('una doble pulsación mientras el guardado aún no termina guarda una sola vez', async () => {
    let terminarGuardado: (ok: boolean) => void = () => {};
    const base = crearAlmacenEnMemoria();
    const guardar = jest.fn(
      () =>
        new Promise<boolean>(r => {
          terminarGuardado = r;
        }),
    );
    const { result, dependencias } = await montar({ ...base, guardar });
    await act(async () => {
      result.current._terminar();
    });
    expect(dependencias.banderaOnboarding.obtener()).toEqual({ tipo: 'visto' });
    await act(async () => {
      result.current._terminar();
    });
    await act(async () => terminarGuardado(true));
    expect(guardar).toHaveBeenCalledTimes(1);
  });

  it('si guardar devuelve false, la bandera queda en visto y no se reintenta al pulsar otra vez (CA10)', async () => {
    const base = crearAlmacenEnMemoria();
    const guardar = jest.fn(async () => false);
    const { result, dependencias } = await montar({ ...base, guardar });
    await act(async () => {
      result.current._terminar();
    });
    await act(async () => {
      result.current._terminar();
    });
    expect(guardar).toHaveBeenCalledTimes(1);
    expect(dependencias.banderaOnboarding.obtener()).toEqual({ tipo: 'visto' });
  });

  it('_anterior en O1 no cambia el índice y _alDesplazar con ancho 0 vuelve a O1', async () => {
    const { result } = await montar(crearAlmacenEnMemoria());
    await act(async () => result.current._alDesplazar(1500, 750));
    expect(result.current.indice).toBe(2);
    await act(async () => result.current._alDesplazar(1500, 0));
    expect(result.current.indice).toBe(0);
    let interceptado = true;
    await act(async () => {
      interceptado = result.current._anterior();
    });
    expect(interceptado).toBe(false);
    expect(result.current.indice).toBe(0);
  });
});

describe('casos de uso: errores del almacén (CA10)', () => {
  it('arrancar con una lectura que devuelve un valor raro deja la bandera pendiente', async () => {
    for (const valor of ['', '0', 'true', ' 1', '1 ']) {
      const bandera = crearBanderaOnboarding();
      await arrancarOnboardingUseCase({
        almacen: crearAlmacenEnMemoria({ [CLAVE]: valor }),
        bandera,
      });
      expect({ valor, estado: bandera.obtener() }).toEqual({
        valor,
        estado: { tipo: 'pendiente' },
      });
    }
  });

  it('marcar visto avisa a los oyentes una sola vez, antes de que termine el guardado', async () => {
    let terminar: (ok: boolean) => void = () => {};
    const almacen = {
      ...crearAlmacenEnMemoria(),
      guardar: jest.fn(
        () =>
          new Promise<boolean>(r => {
            terminar = r;
          }),
      ),
    };
    const bandera = crearBanderaOnboarding({ tipo: 'pendiente' });
    const oyente = jest.fn();
    bandera.suscribir(oyente);
    const promesa = marcarOnboardingVistoUseCase(almacen, bandera);
    expect(oyente).toHaveBeenCalledTimes(1);
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
    terminar(false);
    expect(await promesa).toBe(false);
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it('marcar visto desde cargando (sesión antes de leer) también queda en visto', async () => {
    const almacen = crearAlmacenEnMemoria();
    const bandera = crearBanderaOnboarding();
    expect(await marcarOnboardingVistoUseCase(almacen, bandera)).toBe(true);
    expect(bandera.obtener()).toEqual({ tipo: 'visto' });
    expect(almacen.datos.get(CLAVE)).toBe('1');
  });

  it('varios oyentes: desuscribir uno no afecta a los demás', () => {
    const bandera = crearBanderaOnboarding();
    const a = jest.fn();
    const b = jest.fn();
    const quitarA = bandera.suscribir(a);
    bandera.suscribir(b);
    quitarA();
    bandera.establecer({ tipo: 'pendiente' });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });
});
