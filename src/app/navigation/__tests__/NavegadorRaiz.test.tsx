// CA18: NavegadorRaiz usa el tema oscuro con `dark` (o null) y el claro con `light`. La ruta
// inicial es la pantalla de inicio provisional.
// F1-01b: aserciones ajustadas por el constructor al migrar de DarkTheme/DefaultTheme a los tokens;
// el montaje añade DependenciasProvider porque NavegadorRaiz oculta el splash con useNative.
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { NavegadorRaiz, temaNavegacion } from '@/app/navigation';
import { TemaProvider, temaClaro, temaOscuro } from '@/shared/theme';

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
      <TemaProvider>
        <DependenciasProvider>
          <NavegadorRaiz />
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );

describe('temaNavegacion (CA18)', () => {
  it('con el tema oscuro es dark y usa sus colores', () => {
    const tema = temaNavegacion(temaOscuro);
    expect(tema.dark).toBe(true);
    expect(tema.colors.text).toBe(temaOscuro.colores.texto);
  });

  it('con el tema claro no es dark y usa sus colores', () => {
    const tema = temaNavegacion(temaClaro);
    expect(tema.dark).toBe(false);
    expect(tema.colors.background).toBe(temaClaro.colores.fondo);
  });
});

describe('NavegadorRaiz (CA18)', () => {
  it.each([
    ['dark', temaOscuro],
    [null, temaOscuro],
    ['light', temaClaro],
  ] as const)(
    'con el esquema %p pinta la pantalla inicial con los colores del tema',
    async (esquema, tema) => {
      useColorScheme.mockReturnValue(esquema);
      await montar();
      expect(
        screen.getByRole('header', { name: 'Inglés con Sebas' }),
      ).toBeOnTheScreen();
      expect(screen.getByText('Inglés con Sebas')).toHaveStyle({
        color: tema.colores.texto,
      });
    },
  );

  it('la ruta inicial es la pantalla de inicio provisional, sin cabecera', async () => {
    useColorScheme.mockReturnValue('light');
    await montar();
    expect(screen.getByText(/Base técnica lista/)).toBeOnTheScreen();
    expect(screen.getAllByRole('header')).toHaveLength(1);
  });
});
