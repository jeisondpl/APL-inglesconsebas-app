// CA16: LimiteDeErrores muestra el fallback (título, mensaje y botón accesible «Reintentar» con
// alto ≥ 44) y «Reintentar» vuelve a montar la pantalla.
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { LimiteDeErrores } from '@/app/providers';
import { textosLimiteDeErrores as textos } from '@/app/providers/limiteDeErrores.textos';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'light'),
}));

const useColorScheme = jest.requireMock(
  'react-native/Libraries/Utilities/useColorScheme',
).default as jest.Mock;

/** Pantalla falsa que falla mientras `control.fallar` sea true y cuenta sus montajes. */
const control = { fallar: false, montajes: 0 };
function PantallaFalsa() {
  useEffect(() => {
    control.montajes += 1;
  }, []);
  if (control.fallar) {
    throw new Error('Fallo de render');
  }
  return <Text>Contenido de la pantalla</Text>;
}

let errorConsola: jest.SpyInstance;
beforeEach(() => {
  control.fallar = false;
  control.montajes = 0;
  useColorScheme.mockReturnValue('light');
  errorConsola = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorConsola.mockRestore());

describe('LimiteDeErrores (CA16)', () => {
  it('sin errores muestra a los hijos', async () => {
    await render(
      <LimiteDeErrores>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    expect(screen.getByText('Contenido de la pantalla')).toBeOnTheScreen();
    expect(screen.queryByText(textos.titulo)).toBeNull();
  });

  it('ante un error de render muestra el fallback con título, mensaje y botón', async () => {
    control.fallar = true;
    await render(
      <LimiteDeErrores>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    expect(screen.queryByText('Contenido de la pantalla')).toBeNull();
    expect(
      screen.getByRole('header', { name: textos.titulo }),
    ).toBeOnTheScreen();
    expect(screen.getByText(textos.mensaje)).toBeOnTheScreen();
    const boton = screen.getByRole('button', { name: 'Reintentar' });
    expect(boton).toBeOnTheScreen();
    expect(screen.getByHintText(textos.reintentarAyuda)).toBe(boton);
  });

  it('el botón «Reintentar» tiene un alto mínimo de 44', async () => {
    control.fallar = true;
    await render(
      <LimiteDeErrores>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    const boton = screen.getByRole('button', { name: 'Reintentar' });
    const estilo = StyleSheet.flatten(boton.props.style);
    expect(estilo.minHeight ?? estilo.height).toBeGreaterThanOrEqual(44);
  });

  it('avisa a alCapturar con el error', async () => {
    control.fallar = true;
    const alCapturar = jest.fn();
    await render(
      <LimiteDeErrores alCapturar={alCapturar}>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    expect(alCapturar).toHaveBeenCalledTimes(1);
    expect(alCapturar.mock.calls[0][0]).toEqual(new Error('Fallo de render'));
  });

  it('«Reintentar» vuelve a montar la pantalla desde cero', async () => {
    control.fallar = true;
    await render(
      <LimiteDeErrores>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    const montajesAntes = control.montajes;

    control.fallar = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

    expect(screen.getByText('Contenido de la pantalla')).toBeOnTheScreen();
    expect(screen.queryByText(textos.titulo)).toBeNull();
    expect(control.montajes).toBe(montajesAntes + 1);
  });

  it('si la pantalla sigue fallando, «Reintentar» vuelve al fallback', async () => {
    control.fallar = true;
    await render(
      <LimiteDeErrores>
        <PantallaFalsa />
      </LimiteDeErrores>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeOnTheScreen();
  });

  it.each([
    ['dark', DarkTheme],
    ['light', DefaultTheme],
  ] as const)(
    'el fallback usa los colores del tema de navegación (%s)',
    async (esquema, tema) => {
      useColorScheme.mockReturnValue(esquema);
      control.fallar = true;
      await render(
        <LimiteDeErrores>
          <PantallaFalsa />
        </LimiteDeErrores>,
      );
      expect(screen.getByRole('alert').parent).toHaveStyle({
        backgroundColor: tema.colors.background,
      });
      expect(screen.getByRole('header')).toHaveStyle({
        color: tema.colors.text,
      });
    },
  );
});
