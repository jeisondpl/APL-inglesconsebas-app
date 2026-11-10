// CA9: cliente HTTP con Bearer opcional, gancho de 401, mapeo del {error} de Leap, fallos de red,
// timeout, cuerpos no JSON, 2xx y params en la query. Nunca lanza.
import { crearClienteApi, type IOpcionesClienteApi } from '../api';
import { textosComunes } from '../textos';

const URL_BASE = 'https://app.inglesconsebas.com/api';
const { errores } = textosComunes;

// --- Doble de fetch: solo la parte de Response que usa el cliente ---------------------------
interface IRespuestaFalsa {
  status: number;
  ok: boolean;
  text: () => Promise<string>;
}

const respuesta = (status: number, cuerpo = ''): IRespuestaFalsa => ({
  status,
  ok: status >= 200 && status < 300,
  text: () => Promise.resolve(cuerpo),
});

const respuestaJson = (status: number, cuerpo: unknown) =>
  respuesta(status, JSON.stringify(cuerpo));

const fetchQueResponde = (r: IRespuestaFalsa) =>
  jest.fn((_url: string, _init?: RequestInit) => Promise.resolve(r));

const llamada = (f: jest.Mock, n = 0) => {
  const [url, opciones] = f.mock.calls[n] as [string, RequestInit];
  return { url, opciones };
};

const cabeceras = (f: jest.Mock, n = 0) =>
  llamada(f, n).opciones.headers as Record<string, string>;

const cliente = (
  fetchImpl: jest.Mock,
  extra: Partial<IOpcionesClienteApi> = {},
) =>
  crearClienteApi({
    urlBase: URL_BASE,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...extra,
  });

describe('crearClienteApi · cabecera Authorization (CA9)', () => {
  it('añade el Bearer cuando obtenerToken devuelve un token', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f, {
      obtenerToken: () => Promise.resolve('tok-123'),
    }).get('clases');
    expect(cabeceras(f).Authorization).toBe('Bearer tok-123');
    expect(cabeceras(f).Accept).toBe('application/json');
  });

  it('no añade Authorization cuando no hay token (null)', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f, { obtenerToken: () => Promise.resolve(null) }).get('x');
    expect(cabeceras(f)).not.toHaveProperty('Authorization');
  });

  it('no añade Authorization si no se inyecta obtenerToken', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('x');
    expect(cabeceras(f)).not.toHaveProperty('Authorization');
  });

  it('no añade Authorization cuando el token es una cadena vacía', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f, { obtenerToken: () => Promise.resolve('') }).get('x');
    expect(cabeceras(f)).not.toHaveProperty('Authorization');
  });

  it('si obtenerToken lanza, la petición sale sin token y no lanza', async () => {
    const f = fetchQueResponde(respuestaJson(200, { ok: 1 }));
    const r = await cliente(f, {
      obtenerToken: () => Promise.reject(new Error('keychain bloqueado')),
    }).get('x');
    expect(f).toHaveBeenCalledTimes(1);
    expect(cabeceras(f)).not.toHaveProperty('Authorization');
    expect(r).toEqual({ error: false, response: { ok: 1 }, code: 200 });
  });

  it('si obtenerToken lanza de forma síncrona, tampoco lanza', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    const r = await cliente(f, {
      obtenerToken: () => {
        throw new Error('síncrono');
      },
    }).get('x');
    expect(r.error).toBe(false);
    expect(cabeceras(f)).not.toHaveProperty('Authorization');
  });
});

describe('crearClienteApi · respuesta 401 (CA9)', () => {
  it('llama a alNoAutorizado exactamente una vez y devuelve el error con code 401', async () => {
    const alNoAutorizado = jest.fn();
    const f = fetchQueResponde(respuestaJson(401, { error: 'Token inválido' }));
    const r = await cliente(f, { alNoAutorizado }).get('x');
    expect(alNoAutorizado).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ error: true, msg: 'Token inválido', code: 401 });
  });

  it('sin {error} en el cuerpo usa el mensaje de sesión no válida', async () => {
    const alNoAutorizado = jest.fn();
    const f = fetchQueResponde(respuesta(401));
    const r = await cliente(f, { alNoAutorizado }).post('x', { a: 1 });
    expect(alNoAutorizado).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ error: true, msg: errores.noAutorizado, code: 401 });
  });

  it('con un 401 de cuerpo no JSON también avisa una sola vez', async () => {
    const alNoAutorizado = jest.fn();
    const f = fetchQueResponde(respuesta(401, '<html>401</html>'));
    const r = await cliente(f, { alNoAutorizado }).get('x');
    expect(alNoAutorizado).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ error: true, msg: errores.noAutorizado, code: 401 });
  });

  it('una llamada por cada 401: dos peticiones, dos avisos', async () => {
    const alNoAutorizado = jest.fn();
    const f = fetchQueResponde(respuesta(401));
    const api = cliente(f, { alNoAutorizado });
    await api.get('a');
    await api.get('b');
    expect(alNoAutorizado).toHaveBeenCalledTimes(2);
  });

  it('no llama a alNoAutorizado con otros estados (200, 403, 500)', async () => {
    const alNoAutorizado = jest.fn();
    for (const estado of [200, 403, 500]) {
      await cliente(fetchQueResponde(respuestaJson(estado, {})), {
        alNoAutorizado,
      }).get('x');
    }
    expect(alNoAutorizado).not.toHaveBeenCalled();
  });

  it('sin alNoAutorizado inyectado, un 401 no lanza', async () => {
    const r = await cliente(fetchQueResponde(respuesta(401))).get('x');
    expect(r.error).toBe(true);
    expect(r.code).toBe(401);
  });
});

describe('crearClienteApi · errores de Leap con estado ≠ 2xx (CA9)', () => {
  it.each([400, 403, 404, 409, 422, 500])(
    'mapea {"error":"..."} con estado %i a msg y code',
    async estado => {
      const f = fetchQueResponde(
        respuestaJson(estado, { error: 'Credenciales incorrectas' }),
      );
      const r = await cliente(f).get('x');
      expect(r).toEqual({
        error: true,
        msg: 'Credenciales incorrectas',
        code: estado,
      });
      expect(r).not.toHaveProperty('response', expect.anything());
    },
  );

  it('sin {error} y estado 5xx usa el mensaje de error del servidor', async () => {
    const r = await cliente(fetchQueResponde(respuesta(503))).get('x');
    expect(r).toEqual({ error: true, msg: errores.servidor, code: 503 });
  });

  it('sin {error} y estado 4xx usa el mensaje genérico', async () => {
    const r = await cliente(
      fetchQueResponde(respuestaJson(404, { otra: 'cosa' })),
    ).get('x');
    expect(r).toEqual({ error: true, msg: errores.desconocido, code: 404 });
  });

  it.each([
    ['un error vacío', { error: '   ' }],
    ['un error no textual', { error: true }],
    ['un cuerpo que es un array', ['error']],
    ['un cuerpo null', null],
  ])('ignora %s y usa el mensaje por estado', async (_caso, cuerpo) => {
    const r = await cliente(fetchQueResponde(respuestaJson(500, cuerpo))).get(
      'x',
    );
    expect(r).toEqual({ error: true, msg: errores.servidor, code: 500 });
  });

  it('cuerpo no JSON con estado 5xx: mensaje del servidor, sin lanzar', async () => {
    const r = await cliente(
      fetchQueResponde(respuesta(502, '<html>Bad gateway</html>')),
    ).get('x');
    expect(r).toEqual({ error: true, msg: errores.servidor, code: 502 });
  });
});

describe('crearClienteApi · fallo de red (CA9)', () => {
  it('si fetch rechaza devuelve code 0 y el mensaje de red', async () => {
    const f = jest.fn(() =>
      Promise.reject(new TypeError('Network request failed')),
    );
    const r = await cliente(f).get('x');
    expect(r).toEqual({ error: true, msg: errores.red, code: 0 });
  });

  it('si fetch lanza de forma síncrona tampoco lanza', async () => {
    const f = jest.fn(() => {
      throw new Error('boom');
    });
    const r = await cliente(f).post('x', { a: 1 });
    expect(r).toEqual({ error: true, msg: errores.red, code: 0 });
  });

  it('si leer el cuerpo falla en un 2xx devuelve un error, no lanza', async () => {
    const f = fetchQueResponde({
      status: 200,
      ok: true,
      text: () => Promise.reject(new Error('stream roto')),
    });
    const r = await cliente(f).get('x');
    expect(r.error).toBe(true);
    expect(r.code).toBe(200);
  });
});

describe('crearClienteApi · tiempo límite (CA9)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const fetchQueNoResponde = () =>
    jest.fn(
      (_url: string, _init?: RequestInit) => new Promise<never>(() => {}),
    );

  it('a los 15 000 ms por defecto devuelve code 0 y aborta la petición', async () => {
    const f = fetchQueNoResponde();
    let resultado: unknown;
    const promesa = cliente(f)
      .get('x')
      .then(r => {
        resultado = r;
      });

    await jest.advanceTimersByTimeAsync(14999);
    expect(resultado).toBeUndefined();

    await jest.advanceTimersByTimeAsync(1);
    await promesa;
    expect(resultado).toEqual({
      error: true,
      msg: errores.tiempoAgotado,
      code: 0,
    });
    expect(llamada(f).opciones.signal?.aborted).toBe(true);
  });

  it('respeta tiempoLimiteMs', async () => {
    const f = fetchQueNoResponde();
    const promesa = cliente(f, { tiempoLimiteMs: 500 }).get('x');
    await jest.advanceTimersByTimeAsync(500);
    await expect(promesa).resolves.toEqual({
      error: true,
      msg: errores.tiempoAgotado,
      code: 0,
    });
  });

  it('si responde a tiempo limpia el temporizador y no aborta', async () => {
    const f = fetchQueResponde(respuestaJson(200, { a: 1 }));
    const r = await cliente(f).get('x');
    expect(r.error).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
    expect(llamada(f).opciones.signal?.aborted).toBe(false);
  });
});

describe('crearClienteApi · cuerpos y respuestas 2xx (CA9)', () => {
  it('2xx con JSON devuelve response y code', async () => {
    const datos = { clases: [{ id: 1 }] };
    const r = await cliente(fetchQueResponde(respuestaJson(200, datos))).get<
      typeof datos
    >('x');
    expect(r).toEqual({ error: false, response: datos, code: 200 });
  });

  it('2xx con una lista vacía la devuelve tal cual', async () => {
    const r = await cliente(fetchQueResponde(respuestaJson(200, []))).get('x');
    expect(r).toEqual({ error: false, response: [], code: 200 });
  });

  it('201 se trata como éxito', async () => {
    const r = await cliente(
      fetchQueResponde(respuestaJson(201, { id: 9 })),
    ).post('x', { a: 1 });
    expect(r).toEqual({ error: false, response: { id: 9 }, code: 201 });
  });

  it('2xx con cuerpo vacío es éxito sin response', async () => {
    const r = await cliente(fetchQueResponde(respuesta(204))).get('x');
    expect(r.error).toBe(false);
    expect(r.response).toBeUndefined();
    expect(r.code).toBe(204);
  });

  it('2xx con cuerpo no JSON devuelve error de respuesta inválida, sin lanzar', async () => {
    const r = await cliente(
      fetchQueResponde(respuesta(200, 'Warning: PHP notice <br>')),
    ).get('x');
    expect(r).toEqual({
      error: true,
      msg: errores.respuestaInvalida,
      code: 200,
    });
  });

  it('un {error} dentro de un 200 se devuelve como éxito (riesgo R8 del plan)', async () => {
    const r = await cliente(
      fetchQueResponde(respuestaJson(200, { error: 'raro' })),
    ).get('x');
    expect(r).toEqual({ error: false, response: { error: 'raro' }, code: 200 });
  });
});

describe('crearClienteApi · URL, método y cuerpo (CA9)', () => {
  it('GET pone los params en la query, omite undefined y codifica', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('api.php', {
      endpoint: 'clases',
      action: 'listar',
      id: 5,
      activo: true,
      nada: undefined,
      q: 'a b&c',
    });
    const { url, opciones } = llamada(f);
    expect(url).toBe(
      `${URL_BASE}/api.php?endpoint=clases&action=listar&id=5&activo=true&q=a%20b%26c`,
    );
    expect(opciones.method).toBe('GET');
    expect(opciones.body).toBeUndefined();
    expect(cabeceras(f)).not.toHaveProperty('Content-Type');
  });

  it('sin params no añade "?"', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('api.php');
    expect(llamada(f).url).toBe(`${URL_BASE}/api.php`);
  });

  it('con params todos undefined no añade "?"', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('api.php', { a: undefined });
    expect(llamada(f).url).toBe(`${URL_BASE}/api.php`);
  });

  it('no duplica barras entre la base y la ruta', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await crearClienteApi({
      urlBase: `${URL_BASE}//`,
      fetchImpl: f as unknown as typeof fetch,
    }).get('/api.php');
    expect(llamada(f).url).toBe(`${URL_BASE}/api.php`);
  });

  it('con ruta vacía usa la URL base y los params', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('', { endpoint: 'x' });
    expect(llamada(f).url).toBe(`${URL_BASE}?endpoint=x`);
  });

  it('si la ruta ya trae query, une los params con "&"', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).get('api.php?endpoint=clases', { action: 'ver' });
    expect(llamada(f).url).toBe(
      `${URL_BASE}/api.php?endpoint=clases&action=ver`,
    );
  });

  it('POST envía el cuerpo en JSON con Content-Type y los params en la query', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).post(
      'api.php',
      { nombre: 'Ana', edad: 30 },
      { endpoint: 'alumnos', action: 'crear' },
    );
    const { url, opciones } = llamada(f);
    expect(url).toBe(`${URL_BASE}/api.php?endpoint=alumnos&action=crear`);
    expect(opciones.method).toBe('POST');
    expect(opciones.body).toBe(JSON.stringify({ nombre: 'Ana', edad: 30 }));
    expect(cabeceras(f)['Content-Type']).toBe('application/json');
  });

  it('POST sin cuerpo no envía body ni Content-Type', async () => {
    const f = fetchQueResponde(respuestaJson(200, {}));
    await cliente(f).post('api.php');
    expect(llamada(f).opciones.body).toBeUndefined();
    expect(cabeceras(f)).not.toHaveProperty('Content-Type');
  });

  it('sin fetchImpl usa el fetch global', async () => {
    const original = globalThis.fetch;
    const f = fetchQueResponde(respuestaJson(200, { global: true }));
    globalThis.fetch = f as unknown as typeof fetch;
    try {
      const r = await crearClienteApi({ urlBase: URL_BASE }).get('x');
      expect(f).toHaveBeenCalledTimes(1);
      expect(r.response).toEqual({ global: true });
    } finally {
      globalThis.fetch = original;
    }
  });
});
