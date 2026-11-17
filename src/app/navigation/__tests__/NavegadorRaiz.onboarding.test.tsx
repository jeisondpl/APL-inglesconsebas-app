// F1-05 (constructor): el estudiante cierra sesión desde la hoja del avatar (botonDeCuenta).
// Constructor (EXT-01): el arranque muestra la bienvenida solo la primera vez. CA1, CA2, CA3, CA4,
// CA8, CA10 y CA11 con el contenedor de prueba y la lectura real de la bandera (`cargando`).
// El tester amplía los casos.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
  type IAlmacenEnMemoria,
} from '@/app/di/dependenciasDePrueba';
import { NavegadorRaiz } from '@/app/navigation';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { tokenMemoria } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { TemaProvider } from '@/shared/theme';

const DIA = 24 * 60 * 60 * 1000;
const TITULO_O1 = 'Tu inglés, en un solo lugar';

const sesionDeAna = () =>
  serializarSesion({
    token: tokenMemoria('ana'),
    expiraEn: new Date(Date.now() + 10 * DIA).toISOString(),
    renovarDesde: new Date(Date.now() + DIA).toISOString(),
    usuario: {
      id: 's0000000000000a1',
      nombre: 'Ana Torres',
      usuario: 'ana',
      rol: 'estudiante',
    },
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
          <NavegadorRaiz />
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );

/**
 * F1-05: el inicio del estudiante pasa un `<RefreshControl>` como prop del ScrollView y el
 * elemento tiene referencias circulares; para buscar texto en el árbol se omite esa prop.
 */
const sinRefreshControl = (clave: string, valor: unknown) =>
  clave === 'refreshControl' ? undefined : valor;

const textoDelArbol = () => JSON.stringify(screen.toJSON(), sinRefreshControl);

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

describe('NavegadorRaiz: bienvenida (EXT-01)', () => {
  it('CA1: sin bandera ni sesión arranca en O1 y no monta el login', async () => {
    const { dependencias } = contenedor(crearAlmacenEnMemoria());
    await montar(dependencias);
    expect(
      await screen.findByRole('header', { name: TITULO_O1 }),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Inicia sesión')).toBeNull();
  });

  it('CA2: con la bandera y sin sesión va directo al login, sin pintar O1', async () => {
    const { dependencias } = contenedor(
      crearAlmacenEnMemoria({ hasSeenOnboarding: '1' }),
    );
    const vistos: string[] = [];
    await montar(dependencias);
    vistos.push(textoDelArbol());
    await screen.findByText('Inicia sesión');
    vistos.push(textoDelArbol());
    expect(vistos.some(t => t.includes(TITULO_O1))).toBe(false);
  });

  it('CA3 + CA4: con sesión sin bandera va al inicio, guarda la bandera y al cerrar sesión va al login', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: sesionDeAna() });
    const { dependencias } = contenedor(almacen);
    await montar(dependencias);
    expect(await screen.findByText('Hola, Ana Torres')).toBeOnTheScreen();
    expect(textoDelArbol()).not.toContain(TITULO_O1);
    await waitFor(() =>
      expect(almacen.datos.get('hasSeenOnboarding')).toBe('1'),
    );
    await fireEvent.press(await botonDeCuenta('Cerrar sesión'));
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(textoDelArbol()).not.toContain(TITULO_O1);
  });

  it.each([
    ['Omitir en O2', 1, 'Omitir la bienvenida'],
    ['Comenzar en O4', 3, 'Comenzar'],
  ])(
    'CA8: %s guarda la bandera y deja el login como única ruta',
    async (_caso, avances, boton) => {
      const almacen = crearAlmacenEnMemoria();
      const { dependencias } = contenedor(almacen);
      await montar(dependencias);
      await screen.findByRole('header', { name: TITULO_O1 });
      for (let i = 0; i < avances; i++) {
        await fireEvent.press(
          screen.getByRole('button', { name: 'Siguiente' }),
        );
      }
      await fireEvent.press(screen.getByRole('button', { name: boton }));
      expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
      expect(almacen.datos.get('hasSeenOnboarding')).toBe('1');
      expect(screen.queryByTestId('lista-onboarding')).toBeNull();
    },
  );

  it('CA10: si guardar falla se avanza al login y el siguiente arranque vuelve a O1', async () => {
    const base = crearAlmacenEnMemoria();
    const almacen: IAlmacenEnMemoria = {
      ...base,
      guardar: jest.fn(async () => false),
    };
    const primero = contenedor(almacen);
    const { unmount } = await montar(primero.dependencias);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Omitir la bienvenida' }),
    );
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    await unmount();
    const segundo = contenedor(almacen);
    await montar(segundo.dependencias);
    expect(
      await screen.findByRole('header', { name: TITULO_O1 }),
    ).toBeOnTheScreen();
  });

  it('CA11: con la lectura de la bandera diferida no pinta nada ni oculta el splash', async () => {
    const base = crearAlmacenEnMemoria();
    let resolver: (v: string | null) => void = () => {};
    const almacen: SecureStoragePort = {
      ...base,
      leer: clave =>
        clave === 'hasSeenOnboarding'
          ? new Promise(r => {
              resolver = r;
            })
          : base.leer(clave),
    };
    const { dependencias, splash } = contenedor(almacen);
    await montar(dependencias);
    expect(screen.toJSON()).toBeNull();
    expect(splash.ocultar).not.toHaveBeenCalled();
    await act(async () => resolver(null));
    expect(
      await screen.findByRole('header', { name: TITULO_O1 }),
    ).toBeOnTheScreen();
    await waitFor(() => expect(splash.ocultar).toHaveBeenCalledTimes(1));
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
  });
});
