// CA18: NavegadorRaiz usa el tema oscuro con `dark` (o null) y el claro con `light`.
// F1-01b: aserciones ajustadas por el constructor al migrar de DarkTheme/DefaultTheme a los tokens;
// el montaje añade DependenciasProvider porque NavegadorRaiz oculta el splash con useNative.
// F1-03 (constructor): la ruta inicial depende de la sesión. Los montajes usan el contenedor de
// prueba (sesión en memoria) y, donde se mira el inicio, una sesión guardada de «ana».
// EXT-01 (constructor): contenedorConApi arma IDependencias a mano; añade la bandera de la
// bienvenida en `visto` para que el arranque siga yendo al login.
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import { NavegadorRaiz, temaNavegacion } from '@/app/navigation';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import { invalidarSesionUseCase } from '@/modules/sesion/aplications/invalidarSesion/invalidarSesion';
import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type { IResponseSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import {
  crearMemoriaSesionRepository,
  tokenMemoria,
} from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import { crearClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';
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

// ---------------------------------------------------------------------------------------------
// Tester (F1-03): arranque con sesión guardada (CA7, CA8, CA10), 401 de punta a punta con el
// cliente HTTP real (CA9), cierre con Bearer (CA11) y el inicio sin vuelta atrás al login (CA12).

const sesionGuardada = (cambios: Partial<IResponseSesion> = {}) =>
  serializarSesion({
    token: tokenMemoria('ana'),
    expiraEn: new Date(Date.now() + 10 * DIA).toISOString(),
    renovarDesde: new Date(Date.now() + DIA).toISOString(),
    usuario: {
      id: 's0000000000000a1',
      nombre: 'Ana Torres',
      usuario: 'ana',
      rol: 'estudiante',
    },
    ...cambios,
  });

/** Repositorio en memoria con espías en cada método. */
function repoEspia(obtenerToken: () => string | null) {
  const base = crearMemoriaSesionRepository({ obtenerToken });
  return {
    iniciarSesion: jest.fn(base.iniciarSesion),
    obtenerUsuarioActual: jest.fn(base.obtenerUsuarioActual),
    renovar: jest.fn(base.renovar),
    cerrarSesion: jest.fn(base.cerrarSesion),
  };
}

describe('NavegadorRaiz: arranque con sesión guardada (tester F1-03)', () => {
  beforeEach(() => useColorScheme.mockReturnValue('dark'));

  it('CA7: entra al inicio sin pedir PIN y valida con un solo me', async () => {
    let token: () => string | null = () => null;
    const repo = repoEspia(() => token());
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: sesionGuardada() },
    });
    token = () => dependencias.sesionActiva.token();
    await montarCon(dependencias);
    expect(await screen.findByText('Hola, Ana Torres')).toBeOnTheScreen();
    expect(screen.queryByText('Inicia sesión')).toBeNull();
    expect(screen.queryByLabelText('Usuario')).toBeNull();
    await waitFor(() =>
      expect(repo.obtenerUsuarioActual).toHaveBeenCalledTimes(1),
    );
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
    expect(repo.renovar).not.toHaveBeenCalled();
  });

  it('CA7: la respuesta de me actualiza el nombre y expiraEn guardados', async () => {
    const nuevaExpira = new Date(Date.now() + 30 * DIA).toISOString();
    const repo: SesionRepository = {
      ...crearMemoriaSesionRepository(),
      obtenerUsuarioActual: jest.fn(() =>
        Promise.resolve(
          respuestaOk(
            {
              usuario: {
                id: 's0000000000000a1',
                nombre: 'Ana María Torres',
                usuario: 'ana',
                rol: 'estudiante' as const,
              },
              expiraEn: nuevaExpira,
            },
            200,
          ),
        ),
      ),
    };
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: sesionGuardada() },
    });
    await montarCon(dependencias);
    expect(await screen.findByText('Hola, Ana María Torres')).toBeOnTheScreen();
    const guardada = JSON.parse(
      (await dependencias.nativos.almacenSeguro.leer('sesion')) ?? '{}',
    );
    expect(guardada.usuario.nombre).toBe('Ana María Torres');
    expect(guardada.expiraEn).toBe(nuevaExpira);
    expect(guardada).not.toHaveProperty('pin');
  });

  it('CA8: sin red y con la sesión vigente entra con los datos guardados', async () => {
    const sinRed = () => Promise.resolve(respuestaError<never>('sin red', 0));
    const repo: SesionRepository = {
      iniciarSesion: jest.fn(sinRed),
      obtenerUsuarioActual: jest.fn(sinRed),
      renovar: jest.fn(sinRed),
      cerrarSesion: jest.fn(sinRed),
    };
    const texto = sesionGuardada();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: texto },
    });
    await montarCon(dependencias);
    expect(await screen.findByText('Hola, Ana Torres')).toBeOnTheScreen();
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBe(texto);
  });

  it.each([
    [
      'vencida',
      sesionGuardada({ expiraEn: new Date(Date.now() - DIA).toISOString() }),
    ],
    ['corrupta', '{"version":1,"token":'],
    ['de otra versión', sesionGuardada().replace('"version":1', '"version":2')],
  ])(
    'CA8: con la sesión %s borra el almacén y va al login sin red',
    async (_caso, texto) => {
      const repo = repoEspia(() => null);
      const dependencias = crearDependenciasDePrueba({
        repo,
        almacenInicial: { sesion: texto },
      });
      await montarCon(dependencias);
      expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
      expect(screen.queryByText(/Tu sesión venció/)).toBeNull();
      await expect(
        dependencias.nativos.almacenSeguro.leer('sesion'),
      ).resolves.toBeNull();
      expect(repo.obtenerUsuarioActual).not.toHaveBeenCalled();
      expect(repo.renovar).not.toHaveBeenCalled();
    },
  );

  it('CA10: con renovarDesde pasado renueva una vez y guarda el token nuevo', async () => {
    let token: () => string | null = () => null;
    const repo = repoEspia(() => token());
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: {
        sesion: sesionGuardada({
          renovarDesde: new Date(Date.now() - 60000).toISOString(),
        }),
      },
    });
    token = () => dependencias.sesionActiva.token();
    await montarCon(dependencias);
    await screen.findByText('Hola, Ana Torres');
    await waitFor(() =>
      expect(dependencias.sesionActiva.token()).not.toBe(tokenMemoria('ana')),
    );
    expect(repo.renovar).toHaveBeenCalledTimes(1);
    const guardada = JSON.parse(
      (await dependencias.nativos.almacenSeguro.leer('sesion')) ?? '{}',
    );
    expect(guardada.token).toBe(dependencias.sesionActiva.token());
    expect(new Date(guardada.renovarDesde).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('CA12: tras el login el flujo Auth desaparece (atrás no puede volver al login)', async () => {
    const { dependencias } = contenedorConSplash();
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion('ana', '1234');
    await screen.findByText('Hola, Ana Torres');
    expect(screen.queryByText('Inicia sesión')).toBeNull();
    expect(screen.queryByLabelText('Dígito 1')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/PIN para/);
  });

  it('CA6: el PIN no queda en el almacén tras el login', async () => {
    const { dependencias } = contenedorConSplash();
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion('meli', '1111');
    await screen.findByText('Hola, Meli');
    const texto =
      (await dependencias.nativos.almacenSeguro.leer('sesion')) ?? '';
    expect(Object.keys(JSON.parse(texto)).sort()).toEqual(
      ['expiraEn', 'renovarDesde', 'token', 'usuario', 'version'].sort(),
    );
    expect(texto).not.toMatch(/1111|"pin"/);
  });
});

interface IRespuestaApi {
  status: number;
  cuerpo?: unknown;
}

/**
 * Contenedor con el cliente HTTP real (fetch falso) y el adaptador de auth.php: el 401 pasa por
 * `alNoAutorizado` → invalidarSesion, como en la app.
 */
function contenedorConApi(
  responder: (url: string, init: RequestInit) => IRespuestaApi,
  almacenInicial?: Record<string, string>,
) {
  const almacen = crearAlmacenEnMemoria(almacenInicial);
  const sesionActiva = crearSesionActiva();
  const fetchImpl = jest.fn(async (url: string, init: RequestInit) => {
    const { status, cuerpo } = responder(url, init);
    return {
      ok: status >= 200 && status < 300,
      status,
      text: () =>
        Promise.resolve(cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
    } as unknown as Response;
  });
  const api = crearClienteApi({
    urlBase: 'http://localhost:8080/api',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    obtenerToken: () => Promise.resolve(sesionActiva.token()),
    alNoAutorizado: () => {
      invalidarSesionUseCase(almacen, sesionActiva);
    },
  });
  const dependencias: IDependencias = {
    repositorios: {
      sesion: crearApiSesionRepository(api, { etiquetaDispositivo: 'test' }),
    },
    nativos: {
      splash: { ocultar: () => Promise.resolve() },
      almacenSeguro: almacen,
      enlaces: { abrir: () => Promise.resolve(true) },
    },
    api,
    sesionActiva,
    banderaOnboarding: crearBanderaOnboarding({ tipo: 'visto' }),
  };
  return { dependencias, fetchImpl, almacen };
}

const TOKEN_API = 'f'.repeat(64);
const loginDeAna = {
  role: 'student',
  student: { id: 's0000000000000a1', name: 'Ana Torres', username: 'ana' },
  token: TOKEN_API,
  expiresAt: new Date(Date.now() + 30 * DIA).toISOString(),
  renewAfter: new Date(Date.now() + DIA).toISOString(),
};

const cabeceras = (init: RequestInit | undefined) =>
  (init?.headers ?? {}) as Record<string, string>;

describe('NavegadorRaiz: cliente HTTP real (tester F1-03)', () => {
  beforeEach(() => useColorScheme.mockReturnValue('dark'));

  it('CA9: si me da 401 con sesión guardada, borra el almacén y el login avisa que venció', async () => {
    const { dependencias, almacen, fetchImpl } = contenedorConApi(
      () => ({
        status: 401,
        cuerpo: { error: 'Sesión revocada', code: 'session_revoked' },
      }),
      { sesion: sesionGuardada({ token: TOKEN_API }) },
    );
    await montarCon(dependencias);
    expect(
      await screen.findByText('Tu sesión venció. Vuelve a iniciar sesión.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
    expect(almacen.datos.has('sesion')).toBe(false);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/auth.php?action=me');
    expect(cabeceras(init).Authorization).toBe(`Bearer ${TOKEN_API}`);
  });

  it('CA9: el 401 del propio login (credenciales) no muestra el aviso ni limpia nada', async () => {
    const { dependencias } = contenedorConApi(() => ({
      status: 401,
      cuerpo: {
        error: 'Usuario o PIN incorrecto',
        code: 'invalid_credentials',
      },
    }));
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion('ana', '0000');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuario o PIN incorrecto',
    );
    expect(screen.queryByText(/Tu sesión venció/)).toBeNull();
    expect(dependencias.sesionActiva.obtener()).toEqual({ tipo: 'sinSesion' });
  });

  it('CA1 + CA11: login real lleva al inicio y Cerrar sesión hace logout con Bearer y borra', async () => {
    const { dependencias, fetchImpl, almacen } = contenedorConApi(
      (url, init) => {
        if (url.endsWith('action=logout')) {
          return { status: 200, cuerpo: { ok: true } };
        }
        if (init.method === 'POST') {
          return { status: 200, cuerpo: loginDeAna };
        }
        return { status: 500 };
      },
    );
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion('  ANA ', '1234');
    expect(await screen.findByText('Hola, Ana Torres')).toBeOnTheScreen();
    const cuerpoLogin = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    expect(cuerpoLogin).toEqual({
      username: 'ana',
      pin: '1234',
      client: 'app',
      deviceLabel: 'test',
    });
    expect(almacen.datos.get('sesion')).toContain(TOKEN_API);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    const logout = fetchImpl.mock.calls.find(([u]) =>
      String(u).endsWith('action=logout'),
    );
    expect(logout).toBeDefined();
    expect(cabeceras(logout?.[1]).Authorization).toBe(`Bearer ${TOKEN_API}`);
    expect(almacen.datos.has('sesion')).toBe(false);
    // Cerrar no es «vencida»: sin aviso.
    expect(screen.queryByText(/Tu sesión venció/)).toBeNull();
  });

  it('CA11: sin red, Cerrar sesión también vuelve al login y borra', async () => {
    let conRed = true;
    const { dependencias, almacen } = contenedorConApi(() => {
      if (!conRed) {
        throw new TypeError('Network request failed');
      }
      return { status: 200, cuerpo: loginDeAna };
    });
    await montarCon(dependencias);
    await screen.findByText('Inicia sesión');
    await iniciarSesion('ana', '1234');
    await screen.findByText('Hola, Ana Torres');
    conRed = false;
    await fireEvent.press(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    );
    expect(await screen.findByText('Inicia sesión')).toBeOnTheScreen();
    expect(almacen.datos.has('sesion')).toBe(false);
  });
});
