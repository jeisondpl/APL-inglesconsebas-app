// CA17, caso límite: si API_URL no tiene esquema (http://…), la pantalla muestra el valor tal cual
// en lugar de fallar.
// F1-01b: el constructor añade TemaProvider al montaje (la pantalla usa el sistema de diseño).
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { TemaProvider } from '@/shared/theme';

jest.mock('react-native-config', () => {
  const config = { API_URL: 'servidor-local:8080', APP_ENV: 'staging' };
  return { __esModule: true, default: config, Config: config };
});

it('muestra el entorno y la API_URL sin esquema tal cual', async () => {
  await render(
    <SafeAreaProvider>
      <TemaProvider>
        <NavigationContainer>
          <InicioProvisionalScreen />
        </NavigationContainer>
      </TemaProvider>
    </SafeAreaProvider>,
  );
  expect(screen.getByText('Entorno: staging')).toBeOnTheScreen();
  expect(screen.getByText('Servidor: servidor-local:8080')).toBeOnTheScreen();
});
