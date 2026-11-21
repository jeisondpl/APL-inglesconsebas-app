// F1-03b (1.15): el aviso «sin conexión».
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import {
  BannerConexion,
  ConBannerConexion,
} from '@/app/conexion/BannerConexion';
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
    expect(
      screen.getByText('Sin conexión · revisa tu internet'),
    ).toBeOnTheScreen();

    await act(async () => conexion.marcarGuardado());
    expect(
      screen.getByText('Sin conexión · viendo lo último que guardamos'),
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

  it('mientras se ve, la app baja lo justo para no quedar tapada', async () => {
    const conexion = crearEstadoConexion();
    const dependencias = crearDependenciasDePrueba({ conexion });
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider valor={dependencias}>
            <ConBannerConexion>
              <Text>Hola, Meli</Text>
            </ConBannerConexion>
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    const app = () =>
      StyleSheet.flatten(screen.getByTestId('app-bajo-banner').props.style);
    expect(app().paddingTop).toBe(0);
    await act(async () => conexion.marcarSinConexion());
    await fireEvent(screen.getByTestId('banner-sin-conexion'), 'layout', {
      nativeEvent: { layout: { height: 80 } },
    });
    expect(app().paddingTop).toBe(80);
    expect(screen.getByText('Hola, Meli')).toBeOnTheScreen();
    await act(async () => conexion.marcarEnLinea());
    expect(app().paddingTop).toBe(0);
  });
});
