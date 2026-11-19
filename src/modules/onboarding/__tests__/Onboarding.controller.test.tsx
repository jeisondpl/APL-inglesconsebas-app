// Constructor (EXT-01): arranque de la bandera (lectura única y CA4) y paginación y cierre del
// controller de la bienvenida (CA9). El tester amplía los casos.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import {
  useArranqueOnboarding,
  useOnboardingController,
} from '@/modules/onboarding/aplications/controllers/Onboarding.controller';

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

describe('useArranqueOnboarding', () => {
  it('lee la bandera una sola vez y la publica', async () => {
    const almacen = crearAlmacenEnMemoria({ hasSeenOnboarding: '1' });
    const leer = jest.spyOn(almacen, 'leer');
    const dependencias = crearDependenciasDePrueba({
      almacen,
      onboardingInicial: { tipo: 'cargando' },
    });
    const { result, rerender } = await renderHook(
      () => useArranqueOnboarding(false),
      { wrapper: envoltorio(dependencias) },
    );
    expect(result.current).toEqual({ tipo: 'visto' });
    await rerender({});
    expect(leer).toHaveBeenCalledTimes(1);
  });

  it('sin bandera ni sesión queda pendiente', async () => {
    const dependencias = crearDependenciasDePrueba({
      onboardingInicial: { tipo: 'cargando' },
    });
    const { result } = await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    expect(result.current).toEqual({ tipo: 'pendiente' });
  });

  it('con sesión y la bandera pendiente la marca y la guarda (CA4)', async () => {
    const almacen = crearAlmacenEnMemoria();
    const dependencias = crearDependenciasDePrueba({
      almacen,
      onboardingInicial: { tipo: 'cargando' },
    });
    const { result } = await renderHook(() => useArranqueOnboarding(true), {
      wrapper: envoltorio(dependencias),
    });
    expect(result.current).toEqual({ tipo: 'visto' });
    expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
  });

  it('si ya no está en cargando, no lee', async () => {
    const almacen = crearAlmacenEnMemoria();
    const leer = jest.spyOn(almacen, 'leer');
    const dependencias = crearDependenciasDePrueba({ almacen });
    await renderHook(() => useArranqueOnboarding(false), {
      wrapper: envoltorio(dependencias),
    });
    expect(leer).not.toHaveBeenCalled();
  });
});

describe('useOnboardingController', () => {
  async function montar(
    dependencias = crearDependenciasDePrueba({
      onboardingInicial: { tipo: 'pendiente' },
    }),
  ) {
    const r = await renderHook(() => useOnboardingController(), {
      wrapper: envoltorio(dependencias),
    });
    return { ...r, dependencias };
  }

  it('_siguiente avanza y _anterior retrocede; en la primera no intercepta', async () => {
    const { result } = await montar();
    expect(result.current.indice).toBe(0);
    expect(result.current.total).toBe(4);
    let interceptado = true;
    await act(async () => {
      interceptado = result.current._anterior();
    });
    expect(interceptado).toBe(false);
    await act(async () => result.current._siguiente());
    expect(result.current.indice).toBe(1);
    await act(async () => {
      interceptado = result.current._anterior();
    });
    expect(interceptado).toBe(true);
    expect(result.current.indice).toBe(0);
  });

  it('_alDesplazar sincroniza el índice y marca la última', async () => {
    const { result } = await montar();
    await act(async () => result.current._alDesplazar(720, 360));
    expect(result.current.indice).toBe(2);
    expect(result.current.esUltima).toBe(false);
    await act(async () => result.current._alDesplazar(1080, 360));
    expect(result.current.esUltima).toBe(true);
  });

  it('_siguiente en la última termina y marca visto', async () => {
    const almacen = crearAlmacenEnMemoria();
    const dependencias = crearDependenciasDePrueba({
      almacen,
      onboardingInicial: { tipo: 'pendiente' },
    });
    const { result } = await montar(dependencias);
    await act(async () => result.current._alDesplazar(1080, 360));
    await act(async () => result.current._siguiente());
    expect(dependencias.banderaOnboarding.obtener()).toEqual({
      tipo: 'visto',
    });
    expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
  });

  it('_terminar doble guarda una sola vez (CA9)', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const { result } = await montar(
      crearDependenciasDePrueba({
        almacen,
        onboardingInicial: { tipo: 'pendiente' },
      }),
    );
    await act(async () => {
      result.current._terminar();
      result.current._terminar();
    });
    expect(guardar).toHaveBeenCalledTimes(1);
  });
});
