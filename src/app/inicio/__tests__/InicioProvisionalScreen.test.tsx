// CA17: la pantalla de inicio provisional muestra el nombre, la versión de package.json y el
// entorno leído de react-native-config. Este archivo usa una configuración de producción distinta
// de la del mock global (dev, localhost) para comprobar que la pantalla la lee de verdad.
// F1-01b: el constructor añade TemaProvider al montaje (la pantalla usa el sistema de diseño).
// F1-03 (constructor): la pantalla lee la sesión; el montaje añade el contenedor de prueba con una
// sesión activa de «ana».
import { NavigationContainer } from '@react-navigation/native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { TemaProvider } from '@/shared/theme';

import { version } from '../../../../package.json';

jest.mock('react-native-config', () => {
  const config = {
    API_URL: 'https://app.inglesconsebas.com/api/',
    APP_ENV: 'prod',
  };
  return { __esModule: true, default: config, Config: config };
});

const conAna = () =>
  crearDependenciasDePrueba({
    estadoInicial: {
      tipo: 'autenticado',
      sesion: {
        token: 't',
        expiraEn: '2099-01-01T00:00:00Z',
        renovarDesde: null,
        usuario: {
          id: 's1',
          nombre: 'Ana Torres',
          usuario: 'ana',
          rol: 'estudiante',
        },
      },
    },
  });

const montar = () =>
  render(
    <SafeAreaProvider>
      <TemaProvider>
        <DependenciasProvider valor={conAna()}>
          <NavigationContainer>
            <InicioProvisionalScreen />
          </NavigationContainer>
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );

describe('InicioProvisionalScreen (CA17)', () => {
  it('muestra el nombre de la app como encabezado', async () => {
    await montar();
    expect(
      screen.getByRole('header', { name: 'Inglés con Sebas' }),
    ).toBeOnTheScreen();
  });

  it('muestra la versión de package.json', async () => {
    await montar();
    expect(version).toBe('0.1.0');
    expect(screen.getByText(`Versión ${version}`)).toBeOnTheScreen();
  });

  it('muestra el entorno de react-native-config', async () => {
    await montar();
    expect(screen.getByText('Entorno: prod')).toBeOnTheScreen();
  });

  it('muestra solo el host de API_URL', async () => {
    await montar();
    expect(
      screen.getByText('Servidor: app.inglesconsebas.com'),
    ).toBeOnTheScreen();
  });

  // Tester (F1-03, CA16): el escaparate solo con __DEV__.
  describe('escaparate según __DEV__ (CA16)', () => {
    const global_ = globalThis as unknown as { __DEV__: boolean };
    const original = global_.__DEV__;
    afterEach(() => {
      global_.__DEV__ = original;
    });

    it('con __DEV__ se ve «Ver sistema de diseño»', async () => {
      global_.__DEV__ = true;
      await montar();
      expect(
        screen.getByRole('button', { name: 'Ver sistema de diseño' }),
      ).toBeOnTheScreen();
    });

    it('sin __DEV__ (release) no aparece', async () => {
      global_.__DEV__ = false;
      await montar();
      expect(
        screen.queryByRole('button', { name: 'Ver sistema de diseño' }),
      ).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Cerrar sesión' }),
      ).toBeOnTheScreen();
    });
  });

  it('«Cerrar sesión» pasa la sesión a sinSesion/cerrada y borra el almacén (CA11)', async () => {
    const dependencias = conAna();
    await dependencias.nativos.almacenSeguro.guardar('sesion', '{}');
    await render(
      <SafeAreaProvider>
        <TemaProvider>
          <DependenciasProvider valor={dependencias}>
            <NavigationContainer>
              <InicioProvisionalScreen />
            </NavigationContainer>
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    await waitFor(() =>
      expect(dependencias.sesionActiva.obtener()).toEqual({
        tipo: 'sinSesion',
        motivo: 'cerrada',
      }),
    );
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBeNull();
  });

  it('saluda por el nombre y muestra el rol (F1-03)', async () => {
    await montar();
    expect(screen.getByText('Hola, Ana Torres')).toBeOnTheScreen();
    expect(screen.getByText('Rol: Estudiante')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeOnTheScreen();
  });
});
