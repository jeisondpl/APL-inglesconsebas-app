// F1-05 (constructor): el estudiante cierra sesión desde la hoja del avatar (botonDeCuenta).
// Tester (EXT-01): el arranque y la salida de la bienvenida contra CA1–CA4, CA8–CA11.
// - CA2: se cuenta cada render de OnboardingScreen (no se muestrea el árbol): con la bandera
//   guardada no debe pintarse nunca.
// - CA11: el splash espera a la sesión **y** a la bandera, en cualquier orden, y se oculta una sola
//   vez aunque luego se cambie de flujo (bienvenida → login, inicio → login).
// - CA8: atrás de Android en el login (con el BackHandler real de Android) sale de la app: no queda
//   la bienvenida detrás.
// - CA4 y CA10 con fallos al guardar y con un segundo arranque sobre el mismo almacén.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createElement } from 'react';
import { BackHandler, DeviceEventEmitter } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
  type IAlmacenEnMemoria,
} from '@/app/di/dependenciasDePrueba';
import { NavegadorRaiz } from '@/app/navigation';
import type { RolUsuario } from '@/modules/sesion/domain/entities/Sesion.entities';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { tokenMemoria } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { TemaProvider } from '@/shared/theme';

// Contador de renders de la pantalla de la bienvenida (la real, envuelta).
const mockRendersBienvenida = { n: 0 };
jest.mock('@/modules/onboarding/presentation/screens/OnboardingScreen', () => {
  const real = jest.requireActual(
    '@/modules/onboarding/presentation/screens/OnboardingScreen',
  );
  const { createElement: crear } = jest.requireActual('react');
  return {
    OnboardingScreen: () => {
      mockRendersBienvenida.n += 1;
      return crear(real.OnboardingScreen);
    },
  };
});

// Jest corre como iOS, donde BackHandler no hace nada: se usa la implementación de Android.
jest.mock('react-native/Libraries/Utilities/BackHandler', () =>
  jest.requireActual('react-native/Libraries/Utilities/BackHandler.android'),
);

const DIA = 24 * 60 * 60 * 1000;
const TITULO_O1 = 'Tu inglés, en un solo lugar';
const CLAVE = 'hasSeenOnboarding';

const USUARIOS: Record<
  string,
  { id: string; nombre: string; rol: RolUsuario }
> = {
  ana: { id: 's0000000000000a1', nombre: 'Ana Torres', rol: 'estudiante' },
  meli: { id: 't025ce0c8974fad25', nombre: 'Meli', rol: 'profe' },
};

const sesionDe = (usuario: keyof typeof USUARIOS) =>
  serializarSesion({
    token: tokenMemoria(usuario),
    expiraEn: new Date(Date.now() + 10 * DIA).toISOString(),
    renovarDesde: new Date(Date.now() + DIA).toISOString(),
    usuario: { ...USUARIOS[usuario], usuario },
  });

function contenedor(almacen: SecureStoragePort) {
  const splash = { ocultar: jest.fn(() => Promise.resolve()) };
  const dependencias = crearDependenciasDePrueba({
    almacen,
    splash,
    onboardingInicial: { tipo: 'cargando' },
  });
  return { dependencias, splash };
}

const montar = (dependencias: IDependencias) =>
  render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial="oscuro">
        <DependenciasProvider valor={dependencias}>
          {createElement(NavegadorRaiz)}
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );

/** Almacén cuyo `leer` queda pendiente para las claves indicadas hasta que se resuelvan. */
function almacenDiferido(
  base: IAlmacenEnMemoria,
  claves: string[],
): {
  almacen: IAlmacenEnMemoria;
  resolver: (clave: string) => Promise<void>;
} {
  const pendientes = new Map<string, () => void>();
  const almacen: IAlmacenEnMemoria = {
    ...base,
    leer: clave =>
      claves.includes(clave)
        ? new Promise(r => {
            pendientes.set(clave, () => r(base.datos.get(clave) ?? null));
          })
        : base.leer(clave),
  };
  const resolver = (clave: string) =>
    act(async () => {
      pendientes.get(clave)?.();
    });
  return { almacen, resolver };
}

/** Cuántas veces se guardó la bandera. */
const guardadosDeBandera = (guardar: jest.SpyInstance) =>
  guardar.mock.calls.filter(([clave]) => clave === CLAVE).length;

/**
 * F1-05: el inicio del estudiante pasa un `<RefreshControl>` como prop del ScrollView y el
 * elemento tiene referencias circulares; para buscar texto en el árbol se omite esa prop.
 */
const sinRefreshControl = (clave: string, valor: unknown) =>
  clave === 'refreshControl' ? undefined : valor;

const textoDelArbol = () => JSON.stringify(screen.toJSON(), sinRefreshControl);

beforeEach(() => {
  mockRendersBienvenida.n = 0;
});

/**
 * F1-05: el estudiante cierra sesión (y abre el escaparate) desde la hoja del avatar de su inicio;
 * profe y admin siguen con los botones del inicio provisional. Devuelve el botón ya visible.
 */
async function botonDeCuenta(nombre: string) {
  await screen.findAllByRole('button', {
    name: new RegExp(`^(Abrir el menú de tu cuenta|${nombre})$`),
  });
  const avatar = screen.queryByRole('button', {
    name: 'Abrir el menú de tu cuenta',
  });
  if (avatar) {
    await fireEvent.press(avatar);
  }
  return screen.findByRole('button', { name: nombre });
}

describe('NavegadorRaiz · CA1 y CA2: primera vez y siguientes', () => {
  it.each([[''], ['true'], ['0'], ['visto']])(
    'CA1: un valor guardado distinto de «1» (%j) cuenta como sin bandera → O1',
    async valor => {
      const { dependencias } = contenedor(
        crearAlmacenEnMemoria({ [CLAVE]: valor }),
      );
      await montar(dependencias);
      expect(
        await screen.findByRole('header', { name: TITULO_O1 }),
      ).toBeOnTheScreen();
      expect(screen.queryByText('Inicia sesión')).toBeNull();
    },
  );

  it('CA2: con la bandera, la pantalla de la bienvenida no se renderiza ni una vez', async () => {
    const { dependencias, splash } = contenedor(
      crearAlmacenEnMemoria({ [CLAVE]: '1' }),
    );
    await montar(dependencias);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
    expect(textoDelArbol()).not.toContain(TITULO_O1);
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
  });

  it('CA2: con la bandera y la lectura lenta, tampoco hay un render de O1 mientras se espera', async () => {
    const base = crearAlmacenEnMemoria({ [CLAVE]: '1' });
    const { almacen, resolver } = almacenDiferido(base, [CLAVE]);
    const { dependencias, splash } = contenedor(almacen);
    await montar(dependencias);
    expect(screen.toJSON()).toBeNull();
    await resolver(CLAVE);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });

  it('CA1 (control): sin bandera la bienvenida sí se renderiza (el contador funciona)', async () => {
    const { dependencias } = contenedor(crearAlmacenEnMemoria());
    await montar(dependencias);
    await screen.findByRole('header', { name: TITULO_O1 });
    expect(mockRendersBienvenida.n).toBeGreaterThan(0);
  });
});

describe('NavegadorRaiz · CA11: el splash espera a las dos lecturas', () => {
  it('con la sesión diferida y la bandera ya leída no pinta ni oculta el splash', async () => {
    const { almacen, resolver } = almacenDiferido(crearAlmacenEnMemoria(), [
      'sesion',
    ]);
    const { dependencias, splash } = contenedor(almacen);
    await montar(dependencias);
    expect(screen.toJSON()).toBeNull();
    expect(splash.ocultar).not.toHaveBeenCalled();
    expect(dependencias.banderaOnboarding.obtener()).toEqual({
      tipo: 'pendiente',
    });
    await resolver('sesion');
    expect(
      await screen.findByRole('header', { name: TITULO_O1 }),
    ).toBeOnTheScreen();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
  });

  it.each([
    ['primero la bandera, luego la sesión', [CLAVE, 'sesion']],
    ['primero la sesión, luego la bandera', ['sesion', CLAVE]],
  ])(
    'con las dos diferidas (%s) solo pinta al resolver la segunda',
    async (_caso, orden) => {
      const { almacen, resolver } = almacenDiferido(crearAlmacenEnMemoria(), [
        CLAVE,
        'sesion',
      ]);
      const { dependencias, splash } = contenedor(almacen);
      await montar(dependencias);
      await resolver(orden[0]);
      expect(screen.toJSON()).toBeNull();
      expect(splash.ocultar).not.toHaveBeenCalled();
      expect(mockRendersBienvenida.n).toBe(0);
      await resolver(orden[1]);
      expect(
        await screen.findByRole('header', { name: TITULO_O1 }),
      ).toBeOnTheScreen();
      expect(splash.ocultar).toHaveBeenCalledTimes(1);
    },
  );

  it('con sesión guardada y la bandera diferida tampoco pinta el inicio antes de tiempo', async () => {
    const { almacen, resolver } = almacenDiferido(
      crearAlmacenEnMemoria({ sesion: sesionDe('ana') }),
      [CLAVE],
    );
    const { dependencias, splash } = contenedor(almacen);
    await montar(dependencias);
    expect(screen.toJSON()).toBeNull();
    expect(splash.ocultar).not.toHaveBeenCalled();
    await resolver(CLAVE);
    expect(await screen.findByText('Hola, Ana')).toBeOnTheScreen();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(mockRendersBienvenida.n).toBe(0);
  });

  it('el splash se oculta una sola vez aunque luego se pase de la bienvenida al login', async () => {
    const { dependencias, splash } = contenedor(crearAlmacenEnMemoria());
    await montar(dependencias);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Omitir la bienvenida' }),
    );
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });

  it('el splash se oculta una sola vez aunque luego se cierre sesión', async () => {
    const { dependencias, splash } = contenedor(
      crearAlmacenEnMemoria({ sesion: sesionDe('ana') }),
    );
    await montar(dependencias);
    await fireEvent.press(await botonDeCuenta('Cerrar sesión'));
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });
});

describe('NavegadorRaiz · CA3 y CA4: con sesión guardada', () => {
  it('CA3: sesión de profe sin bandera → inicio de la profe, sin bienvenida, y guarda la bandera', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: sesionDe('meli') });
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    expect(await screen.findByText('Hola, Meli')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
    expect(almacen.datos.get(CLAVE)).toBe('1');
  });

  it('CA3: sesión con la bandera ya guardada → inicio y no vuelve a guardarla', async () => {
    const almacen = crearAlmacenEnMemoria({
      sesion: sesionDe('ana'),
      [CLAVE]: '1',
    });
    const guardar = jest.spyOn(almacen, 'guardar');
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    expect(await screen.findByText('Hola, Ana')).toBeOnTheScreen();
    expect(guardadosDeBandera(guardar)).toBe(0);
    expect(mockRendersBienvenida.n).toBe(0);
  });

  it('CA4: sesión sin bandera guarda la bandera una sola vez', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: sesionDe('ana') });
    const guardar = jest.spyOn(almacen, 'guardar');
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    await screen.findByText('Hola, Ana');
    await act(async () => {});
    expect(guardadosDeBandera(guardar)).toBe(1);
  });

  it('CA4: tras cerrar sesión, un nuevo arranque con el mismo almacén va al login, no a O1', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: sesionDe('ana') });
    const primero = contenedor(almacen);
    const { unmount } = await montar(primero.dependencias);
    await fireEvent.press(await botonDeCuenta('Cerrar sesión'));
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(almacen.datos.has('sesion')).toBe(false);
    await unmount();
    mockRendersBienvenida.n = 0;
    const segundo = contenedor(almacen);
    await montar(segundo.dependencias);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
  });

  it('CA4 + CA10: si guardar la bandera falla con sesión, cerrar sesión sigue yendo al login', async () => {
    const base = crearAlmacenEnMemoria({ sesion: sesionDe('ana') });
    const almacen: IAlmacenEnMemoria = {
      ...base,
      guardar: jest.fn((clave: string, valor: string) =>
        clave === CLAVE ? Promise.resolve(false) : base.guardar(clave, valor),
      ),
    };
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    await fireEvent.press(await botonDeCuenta('Cerrar sesión'));
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
    expect(base.datos.has(CLAVE)).toBe(false);
  });
});

describe('NavegadorRaiz · CA8, CA9 y CA10: salir de la bienvenida', () => {
  let salir: jest.SpyInstance;
  beforeEach(() => {
    salir = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});
  });
  afterEach(() => salir.mockRestore());

  const atras = () =>
    act(async () => {
      DeviceEventEmitter.emit('hardwareBackPress', {});
    });

  it.each([
    ['«Omitir» en O2', 1, 'Omitir la bienvenida'],
    ['«Comenzar» en O4', 3, 'Comenzar'],
  ])(
    'CA8: tras %s, atrás de Android en el login sale de la app (no vuelve a la bienvenida)',
    async (_caso, avances, boton) => {
      const { dependencias } = contenedor(crearAlmacenEnMemoria());
      await montar(dependencias);
      await screen.findByRole('header', { name: TITULO_O1 });
      for (let i = 0; i < avances; i++) {
        await fireEvent.press(
          screen.getByRole('button', { name: 'Siguiente' }),
        );
      }
      await fireEvent.press(screen.getByRole('button', { name: boton }));
      expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
      const renders = mockRendersBienvenida.n;
      await atras();
      expect(salir).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
      expect(textoDelArbol()).not.toContain(TITULO_O1);
      expect(mockRendersBienvenida.n).toBe(renders);
    },
  );

  it('CA9: doble pulsación en «Omitir» guarda la bandera una sola vez y llega al login', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    const omitir = await screen.findByRole('button', {
      name: 'Omitir la bienvenida',
    });
    // La segunda pulsación llega sobre el mismo botón, ya en camino al login.
    await fireEvent.press(omitir);
    await fireEvent.press(omitir);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(guardadosDeBandera(guardar)).toBe(1);
  });

  it('CA9: doble pulsación en «Comenzar» guarda la bandera una sola vez', async () => {
    const almacen = crearAlmacenEnMemoria();
    const guardar = jest.spyOn(almacen, 'guardar');
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    await screen.findByRole('header', { name: TITULO_O1 });
    for (let i = 0; i < 3; i++) {
      await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
    }
    const comenzar = screen.getByRole('button', { name: 'Comenzar' });
    // La segunda pulsación llega sobre el mismo botón, ya en camino al login.
    await fireEvent.press(comenzar);
    await fireEvent.press(comenzar);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(guardadosDeBandera(guardar)).toBe(1);
  });

  it('CA10: «Comenzar» con el guardado fallido llega al login y el siguiente arranque vuelve a O1', async () => {
    const base = crearAlmacenEnMemoria();
    const almacen: IAlmacenEnMemoria = {
      ...base,
      guardar: jest.fn(async () => false),
    };
    const primero = contenedor(almacen);
    const { unmount } = await montar(primero.dependencias);
    await screen.findByRole('header', { name: TITULO_O1 });
    for (let i = 0; i < 3; i++) {
      await fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Comenzar' }));
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(base.datos.has(CLAVE)).toBe(false);
    await unmount();
    const segundo = contenedor(almacen);
    await montar(segundo.dependencias);
    expect(
      await screen.findByRole('header', { name: TITULO_O1 }),
    ).toBeOnTheScreen();
  });

  it('CA10: con el guardado correcto, el siguiente arranque va al login sin pintar la bienvenida', async () => {
    const almacen = crearAlmacenEnMemoria();
    const primero = contenedor(almacen);
    const { unmount } = await montar(primero.dependencias);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Omitir la bienvenida' }),
    );
    await screen.findByText('Inicia sesión');
    await unmount();
    mockRendersBienvenida.n = 0;
    const segundo = contenedor(almacen);
    await montar(segundo.dependencias);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(mockRendersBienvenida.n).toBe(0);
  });
});
