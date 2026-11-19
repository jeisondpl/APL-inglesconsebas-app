// F1-03b (1.15): el aviso «sin conexión».
import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { BannerConexion } from '@/app/conexion/BannerConexion';
import { crearEstadoConexion } from '@/shared/lib/conexion';
import { TemaProvider } from '@/shared/theme';

describe('BannerConexion', () => {
  it('aparece sin conexión, dice si es lo guardado y se va al volver', async () => {
    const conexion = crearEstadoConexion();
    const dependencias = crearDependenciasDePrueba({ conexion });
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <BannerConexion />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    expect(screen.queryByTestId('banner-sin-conexion')).toBeNull();

    await act(async () => conexion.marcarSinConexion());
    expect(screen.getByTestId('banner-sin-conexion')).toBeOnTheScreen();
    expect(screen.getByText(/Revisa tu internet/)).toBeOnTheScreen();

    await act(async () => conexion.marcarGuardado());
    expect(
      screen.getByText('Estás viendo lo último que guardamos.'),
    ).toBeOnTheScreen();

    await act(async () => conexion.marcarEnLinea());
    expect(screen.queryByTestId('banner-sin-conexion')).toBeNull();
  });

  it('con un contenedor sin estado de conexión no muestra nada', async () => {
    const dependencias = {
      ...crearDependenciasDePrueba(),
      conexion: undefined,
    };
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <BannerConexion />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    expect(screen.queryByTestId('banner-sin-conexion')).toBeNull();
  });
});
