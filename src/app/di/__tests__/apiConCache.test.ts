// F1-03b (1.15): caché local de lecturas y estado de la conexión.
import {
  crearApiConCache,
  esCacheable,
  MAX_CACHE_CARACTERES,
} from '@/app/di/apiConCache';
import type { CacheLocalPort } from '@/native/ports/CacheLocalPort';
import type { ClienteApi } from '@/shared/lib/api';
import { crearEstadoConexion } from '@/shared/lib/conexion';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

function cacheEnMemoria(): CacheLocalPort & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    leer: async c => datos.get(c) ?? null,
    guardar: async (c, v) => {
      datos.set(c, v);
    },
    limpiar: async () => datos.clear(),
  };
}

const SIN_RED = respuestaError<never>('sin red', 0);

function montar(
  api: Partial<ClienteApi>,
  usuario: string | null = 'ana',
  cache = cacheEnMemoria(),
) {
  const conexion = crearEstadoConexion();
  const envuelta = crearApiConCache(
    { get: jest.fn(), post: jest.fn(), ...api } as ClienteApi,
    { cache, conexion, usuario: () => usuario },
  );
  return { envuelta, cache, conexion };
}

describe('esCacheable', () => {
  it('guarda lecturas normales y deja fuera auth, media y el sondeo incremental', () => {
    expect(esCacheable('api.php', { endpoint: 'class_sessions' })).toBe(true);
    expect(esCacheable('api.php', { endpoint: 'chat', after_id: 0 })).toBe(
      true,
    );
    expect(esCacheable('auth.php', { action: 'me' })).toBe(false);
    expect(esCacheable('/auth.php')).toBe(false);
    expect(esCacheable('api.php', { endpoint: 'tareas', view: 'media' })).toBe(
      false,
    );
    expect(esCacheable('api.php', { endpoint: 'chat', after_id: 15 })).toBe(
      false,
    );
    expect(esCacheable('api.php')).toBe(true);
  });
});

describe('crearApiConCache · lecturas', () => {
  it('guarda lo que baja, por persona y por consulta', async () => {
    const get = jest.fn().mockResolvedValue(respuestaOk({ clases: [1, 2] }));
    const { envuelta, cache, conexion } = montar({ get });
    const r = await envuelta.get('api.php', {
      endpoint: 'class_sessions',
      student_id: 's1',
    });
    expect(r.response).toEqual({ clases: [1, 2] });
    expect([...cache.datos.keys()]).toEqual([
      'ana|api.php?endpoint=class_sessions&student_id=s1',
    ]);
    expect(conexion.obtener().sinConexion).toBe(false);
  });

  it('sin conexión responde con lo último guardado y lo avisa', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk({ n: 1 }))
      .mockResolvedValueOnce(SIN_RED);
    const { envuelta, conexion } = montar({ get });
    await envuelta.get('api.php', { endpoint: 'schedule' });
    const r = await envuelta.get('api.php', { endpoint: 'schedule' });
    expect(r).toMatchObject({ error: false, response: { n: 1 } });
    expect(conexion.obtener()).toEqual({
      sinConexion: true,
      mostrandoGuardado: true,
    });
    // Al volver la conexión, el aviso se va.
    get.mockResolvedValueOnce(respuestaOk({ n: 2 }));
    await envuelta.get('api.php', { endpoint: 'schedule' });
    expect(conexion.obtener()).toEqual({
      sinConexion: false,
      mostrandoGuardado: false,
    });
  });

  it('sin conexión y sin nada guardado devuelve el error de red', async () => {
    const { envuelta, conexion } = montar({
      get: jest.fn().mockResolvedValue(SIN_RED),
    });
    const r = await envuelta.get('api.php', { endpoint: 'tasks' });
    expect(r).toMatchObject({ error: true, msg: 'sin red', code: 0 });
    expect(conexion.obtener()).toEqual({
      sinConexion: true,
      mostrandoGuardado: false,
    });
  });

  it('cada persona ve solo lo suyo', async () => {
    const cache = cacheEnMemoria();
    const a = montar(
      { get: jest.fn().mockResolvedValue(respuestaOk('de ana')) },
      'ana',
      cache,
    );
    await a.envuelta.get('api.php', { endpoint: 'x' });
    const b = montar(
      { get: jest.fn().mockResolvedValue(SIN_RED) },
      'luis',
      cache,
    );
    expect((await b.envuelta.get('api.php', { endpoint: 'x' })).error).toBe(
      true,
    );
  });

  it('sin sesión no guarda ni sirve caché', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk('dato'))
      .mockResolvedValueOnce(SIN_RED);
    const { envuelta, cache } = montar({ get }, null);
    await envuelta.get('api.php', { endpoint: 'x' });
    expect(cache.datos.size).toBe(0);
    expect((await envuelta.get('api.php', { endpoint: 'x' })).error).toBe(true);
  });

  it('un error del servidor es real: no se sirve caché y hay conexión', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk('viejo'))
      .mockResolvedValueOnce(respuestaError('Error', 500));
    const { envuelta, conexion } = montar({ get });
    await envuelta.get('api.php', { endpoint: 'x' });
    expect(await envuelta.get('api.php', { endpoint: 'x' })).toMatchObject({
      error: true,
      code: 500,
    });
    expect(conexion.obtener().sinConexion).toBe(false);
  });

  it('lo que no es cacheable no se guarda aunque llegue bien', async () => {
    const get = jest.fn().mockResolvedValue(respuestaOk({ x: 1 }));
    const { envuelta, cache } = montar({ get });
    await envuelta.get('auth.php', { action: 'me' });
    await envuelta.get('api.php', { endpoint: 'tareas', view: 'media', id: 1 });
    expect(cache.datos.size).toBe(0);
  });

  it('una respuesta enorme no se guarda', async () => {
    const grande = 'x'.repeat(MAX_CACHE_CARACTERES + 1);
    const { envuelta, cache } = montar({
      get: jest.fn().mockResolvedValue(respuestaOk(grande)),
    });
    await envuelta.get('api.php', { endpoint: 'x' });
    expect(cache.datos.size).toBe(0);
  });

  it('un archivo guardado dañado se ignora', async () => {
    const cache = cacheEnMemoria();
    cache.datos.set('ana|api.php?endpoint=x', '{no es json');
    const { envuelta } = montar(
      { get: jest.fn().mockResolvedValue(SIN_RED) },
      'ana',
      cache,
    );
    expect((await envuelta.get('api.php', { endpoint: 'x' })).error).toBe(true);
  });
});

describe('crearApiConCache · escrituras', () => {
  it('no se guardan ni se simulan; solo marcan la conexión', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce(SIN_RED)
      .mockResolvedValueOnce(respuestaOk({ ok: true }))
      .mockResolvedValueOnce(respuestaError('No permitido', 403));
    const { envuelta, conexion, cache } = montar({ post });
    expect((await envuelta.post('api.php', { a: 1 })).error).toBe(true);
    expect(conexion.obtener().sinConexion).toBe(true);
    await envuelta.post('api.php', { a: 1 });
    expect(conexion.obtener().sinConexion).toBe(false);
    await envuelta.post('api.php', { a: 1 }, { endpoint: 'x' });
    expect(conexion.obtener().sinConexion).toBe(false);
    expect(cache.datos.size).toBe(0);
  });
});

describe('estado de la conexión', () => {
  it('avisa a quien escucha solo cuando algo cambia', () => {
    const c = crearEstadoConexion();
    const oyente = jest.fn();
    const quitar = c.suscribir(oyente);
    c.marcarEnLinea();
    expect(oyente).not.toHaveBeenCalled();
    c.marcarSinConexion();
    c.marcarSinConexion();
    expect(oyente).toHaveBeenCalledTimes(1);
    c.marcarGuardado();
    c.marcarSinConexion();
    expect(c.obtener()).toEqual({ sinConexion: true, mostrandoGuardado: true });
    quitar();
    c.marcarEnLinea();
    expect(oyente).toHaveBeenCalledTimes(2);
  });
});
