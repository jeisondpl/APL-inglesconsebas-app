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

  it('con el contenedor real (sin valor) no hay nativos registrados todavía', async () => {
    await expect(
      renderHook(() => useNative('splash' as never), { wrapper: conValor() }),
    ).rejects.toThrow(/«splash»/);
  });
});

describe('crearDependencias (CA11)', () => {
  it('crea repositorios y nativos vacíos y un cliente API con get y post', () => {
    const dependencias = crearDependencias();
    expect(dependencias.repositorios).toEqual({});
    expect(dependencias.nativos).toEqual({});
    expect(typeof dependencias.api.get).toBe('function');
    expect(typeof dependencias.api.post).toBe('function');
  });

  it('el cliente real apunta a API_URL y sale sin Bearer hasta la feature de sesión', async () => {
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

  it('un 401 del cliente real no lanza (alNoAutorizado vacío)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve(''),
      }),
    ) as unknown as typeof fetch;
    try {
      const r = await crearDependencias().api.post('api.php');
      expect(r).toMatchObject({ error: true, code: 401 });
    } finally {
      globalThis.fetch = original;
    }
  });
});
