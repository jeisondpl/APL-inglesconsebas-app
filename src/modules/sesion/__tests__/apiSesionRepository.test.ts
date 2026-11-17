// Tester (F1-03): adaptador de auth.php con el cliente HTTP real y un fetch falso.
// CA1 (cuerpo del login, normalización, 3 roles), CA5 (sin token o rol desconocido → error legible),
// CA4 (401/429/red propagan msg y code) y rutas de me, renew y logout con su Bearer (CA7, CA10, CA11).
import type { IResponseSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import { mensajesSesion } from '@/modules/sesion/domain/sesion.mensajes';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import { crearClienteApi } from '@/shared/lib/api';
import { textosComunes } from '@/shared/lib/textos';

const URL_BASE = 'http://localhost:8080/api';
const TOKEN = 'a'.repeat(64);

interface IRespuestaFalsa {
  status?: number;
  cuerpo?: unknown;
  /** Cuerpo crudo (no JSON). */
  texto?: string;
}

function respuesta({ status = 200, cuerpo, texto }: IRespuestaFalsa) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () =>
      Promise.resolve(
        texto ?? (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
      ),
  } as unknown as Response;
}

function montar(
  r: IRespuestaFalsa | (() => Promise<Response>),
  opciones: { token?: string | null; alNoAutorizado?: () => void } = {},
) {
  const fetchImpl = jest.fn(
    typeof r === 'function' ? r : () => Promise.resolve(respuesta(r)),
  );
  const api = crearClienteApi({
    urlBase: URL_BASE,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    obtenerToken: () => Promise.resolve(opciones.token ?? null),
    alNoAutorizado: opciones.alNoAutorizado,
  });
  const repo = crearApiSesionRepository(api, {
    etiquetaDispositivo: 'motorola moto g77 · Android 14',
  });
  const llamada = (i = 0) => {
    const [url, init] = fetchImpl.mock.calls[i] as unknown as [
      string,
      RequestInit,
    ];
    return {
      url,
      metodo: init.method,
      cabeceras: init.headers as Record<string, string>,
      cuerpo: init.body ? JSON.parse(String(init.body)) : undefined,
    };
  };
  return { repo, fetchImpl, llamada };
}

const loginOk = (extra: Record<string, unknown>) => ({
  token: TOKEN,
  tokenType: 'Bearer',
  expiresIn: 2592000,
  expiresAt: '2026-12-16T12:00:00Z',
  renewAfter: '2026-11-17T12:00:00Z',
  ...extra,
});

describe('apiSesionRepository · login (CA1)', () => {
  it('envía POST auth.php con username recortado en minúsculas, pin, client app y deviceLabel', async () => {
    const { repo, llamada } = montar({
      cuerpo: loginOk({
        role: 'student',
        student: { id: 's1', name: 'Ana Torres', username: 'ana' },
      }),
    });
    await repo.iniciarSesion({ usuario: '  ANA ', pin: '1234' });
    const { url, metodo, cuerpo, cabeceras } = llamada();
    expect(url).toBe(`${URL_BASE}/auth.php`);
    expect(metodo).toBe('POST');
    expect(cuerpo).toEqual({
      username: 'ana',
      pin: '1234',
      client: 'app',
      deviceLabel: 'motorola moto g77 · Android 14',
    });
    expect(cabeceras['Content-Type']).toBe('application/json');
    // El login sale sin Bearer (no hay sesión todavía).
    expect(cabeceras.Authorization).toBeUndefined();
  });

  it('estudiante: mapea student a estudiante con su id, nombre y usuario', async () => {
    const { repo } = montar({
      cuerpo: loginOk({
        role: 'student',
        student: {
          id: 's0000000000000a1',
          name: 'Ana Torres',
          username: 'ana',
        },
      }),
    });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r).toEqual({
      error: false,
      code: 200,
      response: {
        token: TOKEN,
        expiraEn: '2026-12-16T12:00:00Z',
        renovarDesde: '2026-11-17T12:00:00Z',
        usuario: {
          id: 's0000000000000a1',
          nombre: 'Ana Torres',
          usuario: 'ana',
          rol: 'estudiante',
        },
      },
    });
  });

  it('profe: mapea teacher a profe y convierte el id numérico a texto', async () => {
    const { repo } = montar({
      cuerpo: loginOk({
        role: 'teacher',
        teacher: { id: 7, name: 'Meli', username: 'meli' },
      }),
    });
    const r = await repo.iniciarSesion({ usuario: 'meli', pin: '1111' });
    expect((r.response as IResponseSesion | undefined)?.usuario).toEqual({
      id: '7',
      nombre: 'Meli',
      usuario: 'meli',
      rol: 'profe',
    });
  });

  it('admin: el login solo trae role y se usa {id:admin, nombre:Admin} con el usuario enviado', async () => {
    const { repo } = montar({ cuerpo: loginOk({ role: 'admin' }) });
    const r = await repo.iniciarSesion({ usuario: ' YGGODGUZ', pin: '2905' });
    expect((r.response as IResponseSesion | undefined)?.usuario).toEqual({
      id: 'admin',
      nombre: 'Admin',
      usuario: 'yggodguz',
      rol: 'admin',
    });
  });

  it('sin username en la persona usa el usuario enviado; sin renewAfter, renovarDesde es null', async () => {
    const { repo } = montar({
      cuerpo: loginOk({
        role: 'student',
        student: { id: 's1', name: 'Ana Torres' },
        renewAfter: undefined,
      }),
    });
    const r = await repo.iniciarSesion({ usuario: 'Ana', pin: '1234' });
    expect((r.response as IResponseSesion | undefined)?.usuario.usuario).toBe(
      'ana',
    );
    expect(
      (r.response as IResponseSesion | undefined)?.renovarDesde,
    ).toBeNull();
  });
});

describe('apiSesionRepository · respuesta sin token o rol desconocido (CA5)', () => {
  it('el auth.php de producción (sin F1-02, sin token) da el error legible', async () => {
    const { repo } = montar({
      cuerpo: {
        role: 'student',
        student: { id: 's1', name: 'Ana Torres', username: 'ana' },
      },
    });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r.error).toBe(true);
    expect(r.msg).toBe('El servidor todavía no admite la sesión de la App');
    expect(r.response).toBeUndefined();
  });

  it('con token pero sin expiresAt también es error', async () => {
    const { repo } = montar({
      cuerpo: { role: 'admin', token: TOKEN },
    });
    const r = await repo.iniciarSesion({ usuario: 'yggodguz', pin: '2905' });
    expect(r).toMatchObject({ error: true, msg: mensajesSesion.sinToken });
  });

  it('un cuerpo vacío con 200 da el error de sin token', async () => {
    const { repo } = montar({ status: 200 });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r).toMatchObject({ error: true, msg: mensajesSesion.sinToken });
  });

  it.each(['superadmin', undefined, 42])(
    'un role desconocido (%p) da el error de rol',
    async role => {
      const { repo } = montar({ cuerpo: loginOk({ role }) });
      const r = await repo.iniciarSesion({ usuario: 'x', pin: '1234' });
      expect(r).toMatchObject({
        error: true,
        msg: mensajesSesion.rolDesconocido,
      });
      expect(r.response).toBeUndefined();
    },
  );

  it('un rol de estudiante sin datos de student da el error de rol', async () => {
    const { repo } = montar({ cuerpo: loginOk({ role: 'student' }) });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r).toMatchObject({
      error: true,
      msg: mensajesSesion.rolDesconocido,
    });
  });
});

describe('apiSesionRepository · errores del login (CA4)', () => {
  it('401 propaga el mensaje del servidor y el código', async () => {
    const alNoAutorizado = jest.fn();
    const { repo } = montar(
      {
        status: 401,
        cuerpo: {
          error: 'Usuario o PIN incorrecto',
          code: 'invalid_credentials',
        },
      },
      { alNoAutorizado },
    );
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '0000' });
    expect(r).toEqual({
      error: true,
      msg: 'Usuario o PIN incorrecto',
      code: 401,
    });
    // El cliente avisa del 401; quien decide no limpiar nada sin sesión es invalidarSesion (CA9).
    expect(alNoAutorizado).toHaveBeenCalledTimes(1);
  });

  it('429 propaga el mensaje con los minutos', async () => {
    const msg = 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.';
    const { repo } = montar({
      status: 429,
      cuerpo: { error: msg, code: 'too_many_attempts', retryAfter: 900 },
    });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '0000' });
    expect(r).toEqual({ error: true, msg, code: 429 });
  });

  it('sin red da el texto común de red con code 0', async () => {
    const { repo } = montar(() => Promise.reject(new TypeError('Network')));
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r).toEqual({
      error: true,
      msg: textosComunes.errores.red,
      code: 0,
    });
  });

  it('500 sin cuerpo da el texto común de servidor', async () => {
    const { repo } = montar({ status: 500, texto: '<html>' });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r).toMatchObject({
      error: true,
      msg: textosComunes.errores.servidor,
      code: 500,
    });
  });
});

describe('apiSesionRepository · me (CA7)', () => {
  it('hace GET auth.php?action=me con Bearer y mapea usuario y expiración', async () => {
    const { repo, llamada } = montar(
      {
        cuerpo: {
          role: 'student',
          expiresAt: '2026-12-20T00:00:00Z',
          student: { id: 's1', name: 'Ana María Torres', username: 'ana' },
          diag: { x: 1 },
          pkg: 'ignorado',
        },
      },
      { token: TOKEN },
    );
    const r = await repo.obtenerUsuarioActual();
    const { url, metodo, cabeceras, cuerpo } = llamada();
    expect(url).toBe(`${URL_BASE}/auth.php?action=me`);
    expect(metodo).toBe('GET');
    expect(cabeceras.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(cuerpo).toBeUndefined();
    expect(r).toEqual({
      error: false,
      code: 200,
      response: {
        expiraEn: '2026-12-20T00:00:00Z',
        usuario: {
          id: 's1',
          nombre: 'Ana María Torres',
          usuario: 'ana',
          rol: 'estudiante',
        },
      },
    });
  });

  it('me del admin trae admin{id,name,username}', async () => {
    const { repo } = montar({
      cuerpo: {
        role: 'admin',
        expiresAt: '2026-12-20T00:00:00Z',
        admin: { id: 'admin', name: 'Admin', username: 'yggodguz' },
      },
    });
    const r = await repo.obtenerUsuarioActual();
    expect((r.response as IResponseSesion | undefined)?.usuario).toEqual({
      id: 'admin',
      nombre: 'Admin',
      usuario: 'yggodguz',
      rol: 'admin',
    });
  });

  it('me con rol desconocido o sin persona o sin expiresAt es error', async () => {
    const desconocido = await montar({
      cuerpo: { role: 'x', expiresAt: 'y' },
    }).repo.obtenerUsuarioActual();
    expect(desconocido).toMatchObject({
      error: true,
      msg: mensajesSesion.rolDesconocido,
    });
    const sinPersona = await montar({
      cuerpo: { role: 'teacher', expiresAt: '2026-12-20T00:00:00Z' },
    }).repo.obtenerUsuarioActual();
    expect(sinPersona).toMatchObject({
      error: true,
      msg: textosComunes.errores.respuestaInvalida,
    });
    const sinExpira = await montar({
      cuerpo: { role: 'teacher', teacher: { id: 1, name: 'Meli' } },
    }).repo.obtenerUsuarioActual();
    expect(sinExpira).toMatchObject({
      error: true,
      msg: textosComunes.errores.respuestaInvalida,
    });
  });

  it('me con 401 propaga el código para que se invalide la sesión (CA9)', async () => {
    const { repo } = montar({
      status: 401,
      cuerpo: { error: 'Sesión revocada', code: 'session_revoked' },
    });
    await expect(repo.obtenerUsuarioActual()).resolves.toEqual({
      error: true,
      msg: 'Sesión revocada',
      code: 401,
    });
  });
});

describe('apiSesionRepository · renew (CA10)', () => {
  it('hace POST auth.php?action=renew con Bearer y sin cuerpo', async () => {
    const { repo, llamada } = montar(
      {
        cuerpo: {
          token: 'b'.repeat(64),
          expiresAt: '2026-12-20T00:00:00Z',
          renewAfter: '2026-11-18T00:00:00Z',
        },
      },
      { token: TOKEN },
    );
    const r = await repo.renovar();
    const { url, metodo, cabeceras, cuerpo } = llamada();
    expect(url).toBe(`${URL_BASE}/auth.php?action=renew`);
    expect(metodo).toBe('POST');
    expect(cabeceras.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(cuerpo).toBeUndefined();
    expect(r.response).toEqual({
      token: 'b'.repeat(64),
      expiraEn: '2026-12-20T00:00:00Z',
      renovarDesde: '2026-11-18T00:00:00Z',
    });
  });

  it('renew sin renewAfter deja renovarDesde en null; sin token es error', async () => {
    const sinRenew = await montar({
      cuerpo: { token: 'c', expiresAt: '2026-12-20T00:00:00Z' },
    }).repo.renovar();
    expect(sinRenew.response?.renovarDesde).toBeNull();
    const sinToken = await montar({ cuerpo: {} }).repo.renovar();
    expect(sinToken).toMatchObject({
      error: true,
      msg: mensajesSesion.sinToken,
    });
  });

  it('renew con 401 o sin red propaga el error', async () => {
    await expect(
      montar({
        status: 401,
        cuerpo: { error: 'Sesión revocada' },
      }).repo.renovar(),
    ).resolves.toMatchObject({ error: true, code: 401 });
    await expect(
      montar(() => Promise.reject(new Error('offline'))).repo.renovar(),
    ).resolves.toMatchObject({ error: true, code: 0 });
  });
});

describe('apiSesionRepository · logout (CA11)', () => {
  it('hace POST auth.php?action=logout con Bearer y cuerpo {}', async () => {
    const { repo, llamada } = montar(
      { cuerpo: { ok: true } },
      { token: TOKEN },
    );
    const r = await repo.cerrarSesion();
    const { url, metodo, cabeceras, cuerpo } = llamada();
    expect(url).toBe(`${URL_BASE}/auth.php?action=logout`);
    expect(metodo).toBe('POST');
    expect(cabeceras.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(cuerpo).toEqual({});
    expect(r).toEqual({ error: false, response: undefined, code: 200 });
  });

  it('logout sin red devuelve error sin lanzar', async () => {
    const { repo } = montar(() => Promise.reject(new Error('offline')));
    await expect(repo.cerrarSesion()).resolves.toMatchObject({
      error: true,
      code: 0,
    });
  });
});
