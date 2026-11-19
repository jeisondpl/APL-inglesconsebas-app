// F1-03b (1.13): bloqueo con huella o rostro: casos de uso, pantalla y estado.
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import {
  arrancarBloqueoUseCase,
  debeVolverABloquear,
  olvidarBloqueoUseCase,
  SEGUNDOS_PARA_BLOQUEAR,
} from '@/modules/sesion/aplications/bloqueo/bloqueo';
import { useArranqueBloqueo } from '@/modules/sesion/aplications/controllers/Bloqueo.controller';
import { PantallaBloqueo } from '@/modules/sesion/presentation/screens/PantallaBloqueo';
import type { BiometriaPort } from '@/native/ports/BiometriaPort';
import { CLAVE_BLOQUEO_BIOMETRICO, crearBloqueo } from '@/shared/lib/bloqueo';
import { TemaProvider } from '@/shared/theme';

function biometriaFalsa(
  o: Partial<{ disponible: boolean; autenticar: 'ok' | 'cancelado' }> = {},
) {
  const b = {
    disponible: jest.fn().mockResolvedValue(o.disponible ?? true),
    activar: jest.fn().mockResolvedValue({ tipo: 'ok' }),
    desactivar: jest.fn().mockResolvedValue(undefined),
    autenticar: jest.fn().mockResolvedValue({ tipo: o.autenticar ?? 'ok' }),
  };
  return b as typeof b & BiometriaPort;
}

describe('estado del bloqueo', () => {
  it('cargar activo arranca bloqueada; activar en caliente no bloquea; solo bloquea lo activo', () => {
    const b = crearBloqueo();
    const oyente = jest.fn();
    b.suscribir(oyente);
    b.bloquear();
    expect(b.obtener()).toEqual({ activo: false, bloqueada: false });
    expect(oyente).not.toHaveBeenCalled();
    b.establecerActivo(true);
    expect(b.obtener()).toEqual({ activo: true, bloqueada: false });
    b.bloquear();
    expect(b.obtener().bloqueada).toBe(true);
    b.desbloquear();
    b.cargar(true);
    expect(b.obtener()).toEqual({ activo: true, bloqueada: true });
    b.cargar(false);
    expect(b.obtener()).toEqual({ activo: false, bloqueada: false });
  });
});

describe('casos de uso', () => {
  it('arranca bloqueada si estaba activo y hay biometría', async () => {
    const almacen = crearAlmacenEnMemoria({ [CLAVE_BLOQUEO_BIOMETRICO]: '1' });
    const bloqueo = crearBloqueo();
    await arrancarBloqueoUseCase(almacen, biometriaFalsa(), bloqueo);
    expect(bloqueo.obtener()).toEqual({ activo: true, bloqueada: true });
  });

  it('si ya no hay biometría, olvida el bloqueo para no dejar a la persona fuera', async () => {
    const almacen = crearAlmacenEnMemoria({ [CLAVE_BLOQUEO_BIOMETRICO]: '1' });
    const bio = biometriaFalsa({ disponible: false });
    const bloqueo = crearBloqueo();
    await arrancarBloqueoUseCase(almacen, bio, bloqueo);
    expect(bloqueo.obtener()).toEqual({ activo: false, bloqueada: false });
    expect(almacen.datos.has(CLAVE_BLOQUEO_BIOMETRICO)).toBe(false);
    expect(bio.desactivar).toHaveBeenCalled();
  });

  it('sin preferencia guardada no bloquea', async () => {
    const bloqueo = crearBloqueo();
    await arrancarBloqueoUseCase(
      crearAlmacenEnMemoria(),
      biometriaFalsa(),
      bloqueo,
    );
    expect(bloqueo.obtener().activo).toBe(false);
  });

  it('olvidar borra preferencia y marcador', async () => {
    const almacen = crearAlmacenEnMemoria({ [CLAVE_BLOQUEO_BIOMETRICO]: '1' });
    const bio = biometriaFalsa();
    const bloqueo = crearBloqueo();
    bloqueo.cargar(true);
    await olvidarBloqueoUseCase(almacen, bio, bloqueo);
    expect(bloqueo.obtener()).toEqual({ activo: false, bloqueada: false });
    expect(almacen.datos.size).toBe(0);
    expect(bio.desactivar).toHaveBeenCalled();
  });

  it('vuelve a bloquear tras el tiempo en segundo plano', () => {
    expect(debeVolverABloquear(0, SEGUNDOS_PARA_BLOQUEAR * 1000)).toBe(true);
    expect(debeVolverABloquear(0, SEGUNDOS_PARA_BLOQUEAR * 1000 - 1)).toBe(
      false,
    );
  });
});

function envoltorio(deps: ReturnType<typeof crearDependenciasDePrueba>) {
  return ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={deps}>{children}</DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}

describe('PantallaBloqueo', () => {
  it('pide la verificación al abrirse y desbloquea si pasa', async () => {
    const bloqueo = crearBloqueo();
    bloqueo.cargar(true);
    const Envoltorio = envoltorio(
      crearDependenciasDePrueba({ biometria: biometriaFalsa(), bloqueo }),
    );
    await render(
      <Envoltorio>
        <PantallaBloqueo alCerrarSesion={jest.fn()} />
      </Envoltorio>,
    );
    await waitFor(() => expect(bloqueo.obtener().bloqueada).toBe(false));
  });

  it('si no pasa, lo dice y deja reintentar o cerrar sesión', async () => {
    const bloqueo = crearBloqueo();
    bloqueo.cargar(true);
    const bio = biometriaFalsa({ autenticar: 'cancelado' });
    const alCerrarSesion = jest.fn();
    const Envoltorio = envoltorio(
      crearDependenciasDePrueba({ biometria: bio, bloqueo }),
    );
    await render(
      <Envoltorio>
        <PantallaBloqueo alCerrarSesion={alCerrarSesion} />
      </Envoltorio>,
    );
    expect(
      await screen.findByText('No pudimos verificarte. Inténtalo de nuevo.'),
    ).toBeOnTheScreen();
    expect(bloqueo.obtener().bloqueada).toBe(true);
    bio.autenticar.mockResolvedValueOnce({ tipo: 'ok' });
    await fireEvent.press(screen.getByTestId('bloqueo-reintentar'));
    await waitFor(() => expect(bloqueo.obtener().bloqueada).toBe(false));
    await fireEvent.press(screen.getByTestId('bloqueo-cerrar-sesion'));
    expect(alCerrarSesion).toHaveBeenCalled();
  });

  it('si se sale antes de que responda la biometría, no actualiza', async () => {
    const bloqueo = crearBloqueo();
    bloqueo.cargar(true);
    let soltar: (r: unknown) => void = () => undefined;
    const bio = biometriaFalsa();
    bio.autenticar.mockImplementationOnce(() => new Promise(r => (soltar = r)));
    const Envoltorio = envoltorio(
      crearDependenciasDePrueba({ biometria: bio, bloqueo }),
    );
    const vista = await render(
      <Envoltorio>
        <PantallaBloqueo alCerrarSesion={jest.fn()} />
      </Envoltorio>,
    );
    await vista.unmount();
    await act(async () => soltar({ tipo: 'ok' }));
    expect(bloqueo.obtener().bloqueada).toBe(true);
  });
});

describe('useArranqueBloqueo', () => {
  it('con sesión lee el bloqueo; en segundo plano > 1 min vuelve a bloquear; al perder la sesión lo olvida', async () => {
    const almacen = crearAlmacenEnMemoria({ [CLAVE_BLOQUEO_BIOMETRICO]: '1' });
    const bloqueo = crearBloqueo();
    const deps = crearDependenciasDePrueba({
      almacen,
      biometria: biometriaFalsa(),
      bloqueo,
    });
    let manejador: (e: string) => void = () => undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _t: string,
      h: (e: string) => void,
    ) => {
      manejador = h;
      return { remove: jest.fn() };
    }) as never);
    const ahora = jest.spyOn(Date, 'now');
    const { rerender } = await renderHook(
      ({ a }: { a: boolean }) => useArranqueBloqueo(a),
      { wrapper: envoltorio(deps), initialProps: { a: true } },
    );
    await waitFor(() => expect(bloqueo.obtener().bloqueada).toBe(true));

    bloqueo.desbloquear();
    ahora.mockReturnValue(1000);
    await act(async () => manejador('background'));
    ahora.mockReturnValue(31000);
    await act(async () => manejador('active'));
    expect(bloqueo.obtener().bloqueada).toBe(false);
    await act(async () => manejador('background'));
    ahora.mockReturnValue(31000 + 61000);
    await act(async () => manejador('active'));
    expect(bloqueo.obtener().bloqueada).toBe(true);
    // Un «active» sin haber salido no hace nada.
    bloqueo.desbloquear();
    await act(async () => manejador('active'));
    expect(bloqueo.obtener().bloqueada).toBe(false);

    await rerender({ a: false });
    await waitFor(() => expect(almacen.datos.size).toBe(0));
    expect(bloqueo.obtener().activo).toBe(false);
    ahora.mockRestore();
  });
});
