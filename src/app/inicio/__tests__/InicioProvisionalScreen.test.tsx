// CA17: la pantalla de inicio provisional muestra el nombre, la versión de package.json y el
// entorno leído de react-native-config. Este archivo usa una configuración de producción distinta
// de la del mock global (dev, localhost) para comprobar que la pantalla la lee de verdad.
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';

import { version } from '../../../../package.json';

jest.mock('react-native-config', () => {
  const config = {
    API_URL: 'https://app.inglesconsebas.com/api/',
    APP_ENV: 'prod',
  };
  return { __esModule: true, default: config, Config: config };
});

const montar = () =>
  render(
    <SafeAreaProvider>
      <NavigationContainer>
        <InicioProvisionalScreen />
      </NavigationContainer>
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
});
