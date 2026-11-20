// CA11: useRepository y useNative devuelven lo registrado, fallan con un error descriptivo si falta
// la clave o el provider, y los tests pueden sustituir el contenedor con `valor`.
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import {
  crearDependencias,
  DependenciasProvider,
  useNative,
  useRepository,
  type IDependencias,
} from '@/app/di';
import type { ClienteApi } from '@/shared/lib/api';

const apiFalsa: ClienteApi = { get: jest.fn(), post: jest.fn() };
const repoFalso = { listar: jest.fn() };
const nativoFalso = { ocultar: jest.fn() };

// Las interfaces del contenedor están vacías hasta la primera feature con módulo: se fuerza el tipo.
const contenedorFalso = {
  repositorios: { clases: repoFalso },
  nativos: { splash: nativoFalso },
  api: apiFalsa,
} as unknown as IDependencias;

const conValor =
  (valor?: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    <DependenciasProvider valor={valor}>{children}</DependenciasProvider>;

let errorConsola: jest.SpyInstance;
beforeEach(() => {
  // React registra en consola los errores lanzados durante el render.
  errorConsola = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorConsola.mockRestore());

describe('useRepository (CA11)', () => {
  it('devuelve el repositorio registrado en el contenedor inyectado con valor', async () => {
    const { result } = await renderHook(
      () => useRepository('clases' as never),
      {
        wrapper: conValor(contenedorFalso),
      },
    );
    expect(result.current).toBe(repoFalso);
  });

  it('lanza un error descriptivo si la clave no está registrada', async () => {
    await expect(
      renderHook(() => useRepository('inexistente' as never), {
        wrapper: conValor(contenedorFalso),
      }),
    ).rejects.toThrow(/useRepository.*«inexistente».*contenedor\.ts/);
  });

  it('lanza un error descriptivo fuera del provider', async () => {
    await expect(
      renderHook(() => useRepository('clases' as never)),
    ).rejects.toThrow(/useRepository se usó fuera de <DependenciasProvider>/);
  });
});

describe('useNative (CA11)', () => {
  it('devuelve el adaptador nativo registrado', async () => {
    const { result } = await renderHook(() => useNative('splash' as never), {
      wrapper: conValor(contenedorFalso),
    });
    expect(result.current).toBe(nativoFalso);
  });

  it('lanza un error descriptivo si la clave no está registrada', async () => {
    await expect(
      renderHook(() => useNative('camara' as never), {
        wrapper: conValor(contenedorFalso),
      }),
    ).rejects.toThrow(/useNative.*«camara».*contenedor\.ts/);
  });

  it('lanza un error descriptivo fuera del provider', async () => {
    await expect(
      renderHook(() => useNative('splash' as never)),
    ).rejects.toThrow(/useNative se usó fuera de <DependenciasProvider>/);
  });

  // F1-01b: el contenedor real ya registra el splash (ajuste del constructor).
  it('con el contenedor real (sin valor) el splash está registrado', async () => {
    const { result } = await renderHook(() => useNative('splash'), {
      wrapper: conValor(),
    });
    expect(typeof result.current.ocultar).toBe('function');
  });
});

describe('crearDependencias (CA11)', () => {
  // F1-01b: nativos ya no está vacío: registra el splash (ajuste del constructor).
  // F1-03: registra el repositorio de sesión, el almacén seguro, los enlaces y sesionActiva.
  it('crea el repositorio de sesión, los nativos y un cliente API con get y post', () => {
    const dependencias = crearDependencias();
    // F1-05: el inicio del estudiante registra su repositorio.
    expect(Object.keys(dependencias.repositorios)).toEqual([
      'sesion',
      'inicio',
      'inicioProfe',
      'clases',
      'agenda',
      'mensajes',
      'tareas',
      'perfil',
      'admin',
      'notificaciones',
    ]);
    expect(Object.keys(dependencias.nativos)).toEqual([
      'splash',
      'almacenSeguro',
      'enlaces',
      'imagenes',
      'audio',
      'push',
      'biometria',
      'google',
    ]);
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'restaurando',
    });
    expect(typeof dependencias.api.get).toBe('function');
    expect(typeof dependencias.api.post).toBe('function');
  });

  it('el cliente real apunta a API_URL y sale sin Bearer mientras no hay sesión', async () => {
    const original = globalThis.fetch;
    const fetchFalso = jest.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        text: () => Promise.resolve('{}'),
      }),
    );
    globalThis.fetch = fetchFalso as unknown as typeof fetch;
    try {
      const r = await crearDependencias().api.get('api.php', { endpoint: 'x' });
      expect(r.error).toBe(false);
      const [url, init] = fetchFalso.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toBe('http://localhost:8080/api/api.php?endpoint=x');
      expect(init.headers).not.toHaveProperty('Authorization');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('un 401 del cliente real sin sesión no lanza ni cambia el estado', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve(''),
      }),
    ) as unknown as typeof fetch;
    try {
      const dependencias = crearDependencias();
      const r = await dependencias.api.post('api.php');
      expect(r).toMatchObject({ error: true, code: 401 });
      expect(dependencias.sesionActiva.obtener()).toEqual({
        tipo: 'restaurando',
      });
    } finally {
      globalThis.fetch = original;
    }
  });

  // F1-03 (constructor): con sesión, el cliente manda el Bearer y un 401 la invalida (CA9).
  it('con sesión manda el Bearer y un 401 la invalida y borra el almacén', async () => {
    const original = globalThis.fetch;
    const fetchFalso = jest.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve(''),
      }),
    );
    globalThis.fetch = fetchFalso as unknown as typeof fetch;
    try {
      const dependencias = crearDependencias();
      const { almacenSeguro } = dependencias.nativos;
      await almacenSeguro.guardar('sesion', '{}');
      dependencias.sesionActiva.establecer({
        tipo: 'autenticado',
        sesion: {
          token: 'abc',
          expiraEn: '2099-01-01T00:00:00Z',
          renovarDesde: null,
          usuario: {
            id: 's1',
            nombre: 'Ana',
            usuario: 'ana',
            rol: 'estudiante',
          },
        },
      });
      await dependencias.api.get('auth.php', { action: 'me' });
      const [, init] = fetchFalso.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(init.headers).toHaveProperty('Authorization', 'Bearer abc');
      expect(dependencias.sesionActiva.obtener()).toEqual({
        tipo: 'sinSesion',
        motivo: 'vencida',
      });
      await expect(almacenSeguro.leer('sesion')).resolves.toBeNull();
    } finally {
      globalThis.fetch = original;
    }
  });

  // F1-03 vuelta 1 (M1): el 401 tardío de una petición con el token anterior no invalida la
  // sesión que entró después.
  it('un 401 que llega con el token de una sesión anterior no invalida la actual', async () => {
    const original = globalThis.fetch;
    let responder!: () => void;
    globalThis.fetch = jest.fn(
      () =>
        new Promise(res => {
          responder = () =>
            res({ status: 401, ok: false, text: () => Promise.resolve('') });
        }),
    ) as unknown as typeof fetch;
    const usuario = {
      id: 's1',
      nombre: 'Ana',
      usuario: 'ana',
      rol: 'estudiante' as const,
    };
    try {
      const dependencias = crearDependencias();
      dependencias.sesionActiva.establecer({
        tipo: 'autenticado',
        sesion: {
          token: 'anterior',
          expiraEn: '2099-01-01T00:00:00Z',
          renovarDesde: null,
          usuario,
        },
      });
      const peticion = dependencias.api.get('auth.php', { action: 'me' });
      await new Promise(r => setImmediate(r));
      const actual = {
        token: 'actual',
        expiraEn: '2099-01-01T00:00:00Z',
        renovarDesde: null,
        usuario,
      };
      dependencias.sesionActiva.establecer({
        tipo: 'autenticado',
        sesion: actual,
      });
      responder();
      await peticion;
      expect(dependencias.sesionActiva.obtener()).toEqual({
        tipo: 'autenticado',
        sesion: actual,
      });
    } finally {
      globalThis.fetch = original;
    }
  });
});
