// Constructor (F1-04): login rediseñado. CA15 (hero con saludo y tarjeta), CA18 (puntos: pop al
// llenarse, sacudida y rojo 300 ms en un error nuevo) y CA20 (pulso de carga con su etiqueta).
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { crearMemoriaSesionRepository } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { PuntosPin } from '@/modules/sesion/presentation/components/PuntosPin';
import { LoginScreen } from '@/modules/sesion/presentation/screens/LoginScreen';
import { textosSesion } from '@/modules/sesion/presentation/sesion.textos';
import { TemaProvider, temaOscuro } from '@/shared/theme';

const conTema = (hijo: ReactElement) => (
  <TemaProvider preferenciaInicial="oscuro">{hijo}</TemaProvider>
);

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('PuntosPin animado (CA18)', () => {
  it('un error nuevo sacude la fila y pinta los puntos en rojo 300 ms', async () => {
    jest.useFakeTimers();
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    const { rerender } = await render(
      conTema(<PuntosPin escritos={0} total={4} />),
    );
    expect(screen.getAllByTestId('punto-vacio')).toHaveLength(4);
    secuencia.mockClear();
    await rerender(conTema(<PuntosPin escritos={0} total={4} conError />));
    // Sacudida: los 5 golpes en una secuencia.
    expect(secuencia).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    const rojos = screen.getAllByTestId('punto-error');
    expect(rojos).toHaveLength(4);
    expect(StyleSheet.flatten(rojos[0].props.style).backgroundColor).toBe(
      temaOscuro.colores.peligro,
    );
    // La etiqueta sigue anunciando el progreso real.
    expect(screen.getByLabelText('PIN: 0 de 4 dígitos')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
    expect(screen.getAllByTestId('punto-vacio')).toHaveLength(4);
  });

  it('el mismo error no vuelve a sacudir y al escribir se quita el rojo', async () => {
    const { rerender } = await render(
      conTema(<PuntosPin escritos={0} total={4} conError />),
    );
    // Montar ya con error no es una transición: no sacude ni pinta en rojo.
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
    await rerender(conTema(<PuntosPin escritos={0} total={4} />));
    await rerender(conTema(<PuntosPin escritos={0} total={4} conError />));
    expect(screen.getAllByTestId('punto-error')).toHaveLength(4);
    await rerender(conTema(<PuntosPin escritos={1} total={4} conError />));
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
    expect(screen.getAllByTestId('punto-lleno')).toHaveLength(1);
    await rerender(conTema(<PuntosPin escritos={0} total={4} />));
    expect(screen.queryAllByTestId('punto-error')).toHaveLength(0);
  });

  it('un punto que se llena hace pop (0 → 1.15 → 1)', async () => {
    const tiempo = jest.spyOn(Reanimated, 'withTiming');
    const { rerender } = await render(
      conTema(<PuntosPin escritos={0} total={4} />),
    );
    tiempo.mockClear();
    await rerender(conTema(<PuntosPin escritos={1} total={4} />));
    expect(tiempo).toHaveBeenCalledWith(1.15, { duration: 120 });
  });

  it('con reduce-motion no sacude ni hace pop, pero sí marca el error en rojo', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const secuencia = jest.spyOn(Reanimated, 'withSequence');
    const { rerender } = await render(
      conTema(<PuntosPin escritos={0} total={4} />),
    );
    await rerender(conTema(<PuntosPin escritos={1} total={4} />));
    await rerender(conTema(<PuntosPin escritos={0} total={4} conError />));
    expect(secuencia).not.toHaveBeenCalled();
    expect(screen.getAllByTestId('punto-error')).toHaveLength(4);
  });
});

describe('LoginScreen rediseñado (CA15, CA20)', () => {
  async function montar(repo?: SesionRepository) {
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider
            valor={crearDependenciasDePrueba({
              repo,
              estadoInicial: { tipo: 'sinSesion' },
            })}
          >
            <NavigationContainer>
              <LoginScreen />
            </NavigationContainer>
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
  }

  it('muestra el hero (logo, saludo en Nohemi y subtítulo) sobre la tarjeta', async () => {
    await montar();
    expect(
      screen.getByRole('header', { name: 'Inglés con Sebas' }),
    ).toBeOnTheScreen();
    const saludo = screen.getByText(textosSesion.hero.saludo);
    expect(StyleSheet.flatten(saludo.props.style).fontFamily).toBe(
      'Nohemi-Medium',
    );
    expect(screen.getByText(textosSesion.hero.subtitulo)).toBeOnTheScreen();
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
  });

  it('mientras se verifica el PIN, un pulso de carga cubre la tarjeta', async () => {
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      iniciarSesion: jest.fn(() => new Promise(() => {})),
    };
    await montar(repo);
    await fireEvent.changeText(screen.getByLabelText('Usuario'), 'ana');
    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    for (const d of '1234') {
      await fireEvent.press(
        screen.getByRole('button', { name: `Dígito ${d}` }),
      );
    }
    const carga = screen.getByRole('progressbar', {
      name: 'Verificando tu PIN',
    });
    expect(carga).toBeBusy();
  });
});
