// CA18: NavegadorRaiz usa el tema oscuro con `dark` (o null) y el claro con `light`.
// F1-01b: aserciones ajustadas por el constructor al migrar de DarkTheme/DefaultTheme a los tokens;
// el montaje añade DependenciasProvider porque NavegadorRaiz oculta el splash con useNative.
// F1-03 (constructor): la ruta inicial depende de la sesión. Los montajes usan el contenedor de
// prueba (sesión en memoria) y, donde se mira el inicio, una sesión guardada de «ana».
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { NavegadorRaiz, temaNavegacion } from '@/app/navigation';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { tokenMemoria } from '@/modules/sesion/infrastructure/memoriaSesionRepository';
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

const DIA = 24 * 60 * 60 * 1000;

/** Sesión guardada y vigente de «ana» (token conocido por el repositorio en memoria). */
const almacenConAna = () => ({
  sesion: serializarSesion({
    token: tokenMemoria('ana'),
    expiraEn: new Date(Date.now() + 10 * DIA).toISOString(),
    renovarDesde: new Date(Date.now() + DIA).toISOString(),
    usuario: {
      id: 's0000000000000a1',
      nombre: 'Ana Torres',
      usuario: 'ana',
      rol: 'estudiante',
    },
  }),
});

/** Contenedor de prueba con un SplashPort espía. */
function contenedorConSplash(almacenInicial?: Record<string, string>) {
  const splash = { ocultar: jest.fn(() => Promise.resolve()) };
  const dependencias = crearDependenciasDePrueba({ splash, almacenInicial });
  return { splash, dependencias };
}

const arbol = (dependencias: IDependencias, preferencia?: PreferenciaTema) => (
  <SafeAreaProvider>
    <TemaProvider preferenciaInicial={preferencia}>
      <DependenciasProvider valor={dependencias}>
        <NavegadorRaiz />
      </DependenciasProvider>
    </TemaProvider>
  </SafeAreaProvider>
);

const montarCon = (
  dependencias: IDependencias,
  preferencia?: PreferenciaTema,
) => render(arbol(dependencias, preferencia));

/** Monta con la sesión de «ana» guardada y espera al inicio. */
async function montarConSesion(preferencia?: PreferenciaTema) {
  const contexto = contenedorConSplash(almacenConAna());
  const resultado = await montarCon(contexto.dependencias, preferencia);
  await screen.findByText('Hola, Ana Torres');
  return { ...contexto, ...resultado };
}

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
    'con el esquema %p pinta el inicio con los colores del tema',
    async (esquema, tema) => {
      useColorScheme.mockReturnValue(esquema);
      await montarConSesion();
      expect(
        screen.getByRole('header', { name: 'Inglés con Sebas' }),
      ).toBeOnTheScreen();
      expect(screen.getByText(/Inicio provisional/)).toHaveStyle({
        color: tema.colores.textoSecundario,
      });
    },
  );

  it('con sesión, la ruta inicial es el inicio del rol, sin cabecera', async () => {
    useColorScheme.mockReturnValue('light');
    await montarConSesion();
    expect(screen.getByText('Rol: Estudiante')).toBeOnTheScreen();
    expect(screen.getAllByRole('header')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------
// F1-01b (tester): CA7 (temaNavegacion con los tokens y StatusBar), CA9 (onReady oculta el
// splash una vez) y CA12 (el inicio abre el escaparate).

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
      await montarConSesion(preferencia);
      const estilos = barra.mock.calls.map(([p]) => p.barStyle);
      expect(estilos.length).toBeGreaterThan(0);
      expect(new Set(estilos)).toEqual(new Set([estilo]));
    },
  );
});

describe('NavegadorRaiz: splash (CA9)', () => {
  it('cuando la navegación está lista oculta el splash con fundido, una sola vez', async () => {
    useColorScheme.mockReturnValue('dark');
    const { splash } = await montarConSesion();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
    expect(splash.ocultar).toHaveBeenCalledWith({ fundido: true });
  });

  it('cambiar de tema o navegar no vuelve a ocultar el splash', async () => {
    useColorScheme.mockReturnValue('dark');
    const { splash, dependencias, rerender } = await montarConSesion();
    useColorScheme.mockReturnValue('light');
    await rerender(arbol(dependencias));
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
      const base = crearDependenciasDePrueba();
      const sinSplash = {
        ...base,
        nativos: { ...base.nativos, splash: undefined },
      } as unknown as IDependencias;
      delete (sinSplash.nativos as Partial<IDependencias['nativos']>).splash;
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
    await montarConSesion();
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

// ---------------------------------------------------------------------------------------------
// F1-03 (constructor): flujos Auth y App según la sesión (CA1, CA7, CA11, CA12). Los casos de
// fondo los amplía el tester.

/** Pulsa los dígitos del PIN en el teclado. */
async function teclearPin(pin: string) {
  for (const d of pin) {
    await fireEvent.press(screen.getByRole('button', { name: `Dígito ${d}` }));
  }
}

async function iniciarSesion(usuario: string, pin: string) {
  await fireEvent.changeText(screen.getByLabelText('Usuario'), usuario);
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await teclearPin(pin);
}

describe('NavegadorRaiz: sesión (F1-03)', () => {
  beforeEach(() => useColorScheme.mockReturnValue('dark'));

  it('mientras se restaura no pinta nada y el splash sigue visible', async () => {
    const splash = { ocultar: jest.fn(() => Promise.resolve()) };
    const almacen = {
      leer: () => new Promise<string | null>(() => {}),
      guardar: jest.fn(),
      borrar: jest.fn(),
    };
    const dependencias = crearDependenciasDePrueba({ splash, almacen });
    await montarCon(dependencias);
    expect(screen.toJSON()).toBeNull();
    expect(splash.ocultar).not.toHaveBeenCalled();
  });

  it('sin sesión guardada muestra el login y oculta el splash una vez', async () => {
    const { splash, dependencias } = contenedorConSplash();
    await montarCon(dependencias);
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(splash.ocultar).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ana', '1234', 'Hola, Ana Torres', 'Rol: Estudiante'],
    ['meli', '1111', 'Hola, Meli', 'Rol: Profe'],
    ['yggodguz', '2905', 'Hola, Admin', 'Rol: Admin'],
  ])('el login de %s lleva a su inicio', async (usuario, pin, saludo, rol) => {
    const { dependencias } = contenedorConSplash();
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion(usuario, pin);
    expect(await screen.findByText(saludo)).toBeOnTheScreen();
    expect(screen.getByText(rol)).toBeOnTheScreen();
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toMatch(/"token"/);
  });

  it('«Cerrar sesión» vuelve al login con el paso usuario vacío', async () => {
    const { dependencias } = await montarConSesion();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(screen.getByLabelText('Usuario')).toHaveDisplayValue('');
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBeNull();
  });
});
