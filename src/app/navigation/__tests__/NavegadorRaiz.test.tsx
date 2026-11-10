// CA18: NavegadorRaiz usa DarkTheme si useColorScheme() es `dark` y DefaultTheme en cualquier otro
// caso. La ruta inicial es la pantalla de inicio provisional.
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavegadorRaiz, temaNavegacion } from '@/app/navigation';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const useColorScheme = jest.requireMock(
  'react-native/Libraries/Utilities/useColorScheme',
).default as jest.Mock;

const montar = () =>
  render(
    <SafeAreaProvider>
      <NavegadorRaiz />
    </SafeAreaProvider>,
  );

describe('temaNavegacion (CA18)', () => {
  it('devuelve DarkTheme con el esquema dark', () => {
    expect(temaNavegacion('dark')).toBe(DarkTheme);
  });

  it.each(['light', null] as const)(
    'devuelve DefaultTheme con el esquema %p',
    esquema => {
      expect(temaNavegacion(esquema)).toBe(DefaultTheme);
    },
  );
});

describe('NavegadorRaiz (CA18)', () => {
  it('con el sistema en oscuro pinta la pantalla inicial con los colores de DarkTheme', async () => {
    useColorScheme.mockReturnValue('dark');
    await montar();
    const titulo = screen.getByRole('header', { name: 'Inglés con Sebas' });
    expect(titulo).toHaveStyle({ color: DarkTheme.colors.text });
  });

  it.each(['light', null])(
    'con el esquema %p usa los colores de DefaultTheme',
    async esquema => {
      useColorScheme.mockReturnValue(esquema);
      await montar();
      const titulo = screen.getByRole('header', { name: 'Inglés con Sebas' });
      expect(titulo).toHaveStyle({ color: DefaultTheme.colors.text });
    },
  );

  it('la ruta inicial es la pantalla de inicio provisional, sin cabecera', async () => {
    useColorScheme.mockReturnValue('light');
    await montar();
    expect(screen.getByText(/Base técnica lista/)).toBeOnTheScreen();
    expect(screen.getAllByRole('header')).toHaveLength(1);
  });
});
