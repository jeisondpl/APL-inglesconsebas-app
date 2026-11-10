// CA18: NavegadorRaiz usa el tema oscuro con `dark` (o null) y el claro con `light`. La ruta
// inicial es la pantalla de inicio provisional.
// F1-01b: aserciones ajustadas por el constructor al migrar de DarkTheme/DefaultTheme a los tokens;
// el montaje añade DependenciasProvider porque NavegadorRaiz oculta el splash con useNative.
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { NavegadorRaiz, temaNavegacion } from '@/app/navigation';
import {
  TemaProvider,
  temaClaro,
  temaOscuro,
  type PreferenciaTema,
} from '@/shared/theme';

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
      // F1-01b (marca oficial): el nombre ya no es texto sino el logo vectorial; el color del tema
      // se comprueba en el subtítulo.
      expect(screen.getByText(/Base técnica lista/)).toHaveStyle({
        color: tema.colores.textoSecundario,
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

// ---------------------------------------------------------------------------------------------
// F1-01b (tester): CA7 (temaNavegacion con los tokens y StatusBar), CA9 (onReady oculta el
// splash una vez) y CA12 (el inicio abre el escaparate).

/** Contenedor con un SplashPort falso para observar cuándo se oculta el splash. */
function contenedorConSplash() {
  const splash = { ocultar: jest.fn(() => Promise.resolve()) };
  const dependencias = {
    repositorios: {},
    nativos: { splash },
    api: { get: jest.fn(), post: jest.fn() },
  } as unknown as IDependencias;
  return { splash, dependencias };
}

const montarCon = (
  dependencias: IDependencias,
  preferencia?: PreferenciaTema,
) =>
  render(
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={preferencia}>
        <DependenciasProvider valor={dependencias}>
          <NavegadorRaiz />
        </DependenciasProvider>
      </TemaProvider>
    </SafeAreaProvider>,
  );

describe('temaNavegacion con los tokens (CA7)', () => {
  it.each([
    ['oscuro', temaOscuro, true],
    ['claro', temaClaro, false],
  ] as const)(
    'en el tema %s mapea los seis colores y las fuentes sin fontWeight sintético',
    (_modo, tema, dark) => {
      const nav = temaNavegacion(tema);
      expect(nav.dark).toBe(dark);
      expect(nav.colors).toEqual({
        primary: tema.colores.marca,
        background: tema.colores.fondo,
        card: tema.colores.superficie,
        text: tema.colores.texto,
        border: tema.colores.borde,
        notification: tema.colores.marca,
      });
      expect(nav.fonts).toEqual({
        regular: { fontFamily: 'DMSans-Regular', fontWeight: '400' },
        medium: { fontFamily: 'DMSans-Medium', fontWeight: '400' },
        bold: { fontFamily: 'Nohemi-Medium', fontWeight: '400' },
        heavy: { fontFamily: 'Nohemi-Medium', fontWeight: '400' },
      });
    },
  );
});

describe('NavegadorRaiz: StatusBar (CA7)', () => {
  let barra: jest.SpyInstance;
  beforeEach(() => {
    barra = jest.spyOn(StatusBar, 'pushStackEntry');
  });
  afterEach(() => barra.mockRestore());

  it.each([
    ['oscuro', 'light-content'],
    ['claro', 'dark-content'],
  ] as const)(
    'en el tema %s la barra de estado es %s',
    async (preferencia, estilo) => {
      await montarCon(contenedorConSplash().dependencias, preferencia);
      const estilos = barra.mock.calls.map(([p]) => p.barStyle);
      expect(estilos.length).toBeGreaterThan(0);
      expect(new Set(estilos)).toEqual(new Set([estilo]));
    },
  );
});

describe('NavegadorRaiz: splash (CA9)', () => {
  it('cuando la navegación está lista oculta el splash con fundido, una sola vez', async () => {
    useColorScheme.mockReturnValue('dark');
    const { splash, dependencias } = contenedorConSplash();
    await montarCon(dependencias);
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
  });

  it('cambiar de tema o navegar no vuelve a ocultar el splash', async () => {
    useColorScheme.mockReturnValue('dark');
    const { splash, dependencias } = contenedorConSplash();
    const { rerender } = await montarCon(dependencias);
    useColorScheme.mockReturnValue('light');
    await rerender(
      <SafeAreaProvider>
        <TemaProvider>
          <DependenciasProvider valor={dependencias}>
            <NavegadorRaiz />
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ver sistema de diseño' }),
    );
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });

  it('sin splash registrado falla con el error descriptivo de useNative', async () => {
    const errorConsola = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    try {
      const sinSplash = {
        repositorios: {},
        nativos: {},
        api: { get: jest.fn(), post: jest.fn() },
      } as unknown as IDependencias;
      await expect(montarCon(sinSplash)).rejects.toThrow(
        /useNative: no hay ningún adaptador nativo registrado con la clave «splash»/,
      );
    } finally {
      errorConsola.mockRestore();
    }
  });
});

describe('NavegadorRaiz: escaparate (CA12)', () => {
  it('«Ver sistema de diseño» abre el escaparate al primer toque, con cabecera', async () => {
    useColorScheme.mockReturnValue('dark');
    await montarCon(contenedorConSplash().dependencias);
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/Sistema de diseño/);
    const boton = screen.getByRole('button', { name: 'Ver sistema de diseño' });
    await fireEvent.press(boton);
    expect(await screen.findByText(/Tokens y componentes/)).toBeOnTheScreen();
    // La cabecera nativa de react-native-screens recibe el título como prop.
    expect(JSON.stringify(screen.toJSON())).toMatch(
      /"title":"Sistema de diseño"/,
    );
  });
});
