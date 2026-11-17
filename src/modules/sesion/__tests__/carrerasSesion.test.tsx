// Tester (F1-03, vuelta 1): carreras entre el arranque (me/renew en segundo plano), el cierre de
// sesión, un login nuevo y un 401 tardío. Se usan los controllers reales (useArranqueSesion y
// useSesionController) y respuestas diferidas que el test resuelve en el orden que quiere.
// CA7, CA9, CA10, CA11 y B1 de aprobacion.md.
// EXT-01 (constructor): el contenedor armado a mano añade la bandera de la bienvenida en `visto`.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import {
  crearAlmacenEnMemoria,
  crearDependenciasDePrueba,
} from '@/app/di/dependenciasDePrueba';
import {
  useArranqueSesion,
  useSesionController,
} from '@/modules/sesion/aplications/controllers/Sesion.controller';
import { crearBanderaOnboarding } from '@/modules/onboarding/aplications/banderaOnboarding';
import { invalidarSesionUseCase } from '@/modules/sesion/aplications/invalidarSesion/invalidarSesion';
import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import type {
  IResponseRenovacion,
  IResponseSesion,
  IResponseUsuarioActual,
} from '@/modules/sesion/domain/entities/Sesion.entities';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';
import { crearClienteApi } from '@/shared/lib/api';
import { respuestaOk, type HttpResponse } from '@/shared/lib/HttpResponse';

const DIA = 24 * 60 * 60 * 1000;

interface IDiferida<T> {
  promesa: Promise<T>;
  resolver: (valor: T) => void;
}

function diferida<T>(): IDiferida<T> {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>(r => {
    resolver = r;
  });
  return { promesa, resolver };
}

const sesionDe = (
  usuario: 'ana' | 'meli',
  cambios: Partial<IResponseSesion> = {},
): IResponseSesion => ({
  token: `token-${usuario}`,
  expiraEn: new Date(Date.now() + 10 * DIA).toISOString(),
  renovarDesde: new Date(Date.now() + DIA).toISOString(),
  usuario:
    usuario === 'ana'
      ? { id: 's1', nombre: 'Ana Torres', usuario: 'ana', rol: 'estudiante' }
      : { id: 't1', nombre: 'Meli', usuario: 'meli', rol: 'profe' },
  ...cambios,
});

const meDeAna = (): HttpResponse<IResponseUsuarioActual> =>
  respuestaOk(
    {
      usuario: {
        id: 's1',
        nombre: 'Ana (tardía)',
        usuario: 'ana',
        rol: 'estudiante',
      },
      expiraEn: new Date(Date.now() + 30 * DIA).toISOString(),
    },
    200,
  );

/** Repo con `me` y `renew` diferidos; login de meli y logout inmediatos. */
function repoControlado() {
  const me = diferida<HttpResponse<IResponseUsuarioActual>>();
  const renew = diferida<HttpResponse<IResponseRenovacion>>();
  const repo = {
    iniciarSesion: jest.fn(() =>
      Promise.resolve(respuestaOk(sesionDe('meli'), 200)),
    ),
    obtenerUsuarioActual: jest.fn(() => me.promesa),
    renovar: jest.fn(() => renew.promesa),
    cerrarSesion: jest.fn(() => Promise.resolve(respuestaOk<void>(undefined))),
  } satisfies SesionRepository;
  return { repo, me, renew };
}

const envoltorio =
  (dependencias: IDependencias) =>
  ({ children }: { children: ReactNode }) =>
    (
      <DependenciasProvider valor={dependencias}>
        {children}
      </DependenciasProvider>
    );

async function arrancar(dependencias: IDependencias) {
  const r = await renderHook(
    () => ({ estado: useArranqueSesion(), sesion: useSesionController() }),
    { wrapper: envoltorio(dependencias) },
  );
  // Deja que se restaure y se publique la sesión guardada.
  await act(async () => {});
  return r;
}

const leerGuardada = async (almacen: SecureStoragePort) => {
  const texto = await almacen.leer('sesion');
  return texto ? JSON.parse(texto) : null;
};

describe('carreras del arranque (B1)', () => {
  it('(a) logout mientras me está en vuelo: al llegar me, el almacén sigue vacío y sin sesión', async () => {
    const { repo, me } = repoControlado();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: serializarSesion(sesionDe('ana')) },
    });
    const { result } = await arrancar(dependencias);
    expect(dependencias.sesionActiva.obtener().tipo).toBe('autenticado');
    expect(repo.obtenerUsuarioActual).toHaveBeenCalledTimes(1);

    await act(() => result.current.sesion._cerrarSesion());
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });

    await act(async () => me.resolver(meDeAna()));
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBeNull();
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
  });

  it('(a) logout mientras renew está en vuelo: el token renovado no vuelve al almacén', async () => {
    const { repo, me, renew } = repoControlado();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: {
        sesion: serializarSesion(
          sesionDe('ana', {
            renovarDesde: new Date(Date.now() - 1000).toISOString(),
          }),
        ),
      },
    });
    const { result } = await arrancar(dependencias);
    await act(async () => me.resolver(meDeAna()));
    expect(repo.renovar).toHaveBeenCalledTimes(1);

    await act(() => result.current.sesion._cerrarSesion());
    await act(async () =>
      renew.resolver(
        respuestaOk(
          {
            token: 'token-ana-renovado',
            expiraEn: new Date(Date.now() + 30 * DIA).toISOString(),
            renovarDesde: new Date(Date.now() + DIA).toISOString(),
          },
          200,
        ),
      ),
    );
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBeNull();
    expect(dependencias.sesionActiva.obtener().tipo).toBe('sinSesion');
  });

  it('(a) me llega mientras se borra el almacén del logout: el almacén queda vacío', async () => {
    // Borrado del Keychain lento (llamada nativa): me responde en medio.
    const base = crearAlmacenEnMemoria({
      sesion: serializarSesion(sesionDe('ana')),
    });
    const borrado = diferida<void>();
    let borradoLento = false;
    const almacen = {
      ...base,
      borrar: async (clave: string) => {
        if (borradoLento) {
          await borrado.promesa;
        }
        return base.borrar(clave);
      },
    };
    const { repo, me } = repoControlado();
    const dependencias = crearDependenciasDePrueba({ repo, almacen });
    const { result } = await arrancar(dependencias);

    borradoLento = true;
    let cierre: Promise<void> = Promise.resolve();
    await act(async () => {
      cierre = result.current.sesion._cerrarSesion();
    });
    // El borrado está en curso; llega me de la sesión que se está cerrando.
    await act(async () => me.resolver(meDeAna()));
    await act(async () => {
      borrado.resolver();
      await cierre;
    });
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
    expect(base.datos.has('sesion')).toBe(false);
  });

  // V1-F1 (vuelta 1, ver pruebas.md): este caso fallaba porque durante el borrado del cierre la
  // sesión seguía vigente. Corregido en la vuelta 2 con `iniciarCierre` antes de cualquier await.
  it('(a) me llega mientras el Keychain borra (el borrado se aplica al empezar, como la llamada nativa): el almacén queda vacío', async () => {
    // Como react-native-keychain: resetGenericPassword se encola en el hilo nativo y se aplica
    // antes que un setGenericPassword pedido después, pero la promesa de JS resuelve más tarde.
    const base = crearAlmacenEnMemoria({
      sesion: serializarSesion(sesionDe('ana')),
    });
    const fin = diferida<void>();
    let borradoLento = false;
    const almacen = {
      ...base,
      borrar: async (clave: string) => {
        await base.borrar(clave);
        if (borradoLento) {
          await fin.promesa;
        }
      },
    };
    const { repo, me } = repoControlado();
    const dependencias = crearDependenciasDePrueba({ repo, almacen });
    const { result } = await arrancar(dependencias);

    borradoLento = true;
    let cierre: Promise<void> = Promise.resolve();
    await act(async () => {
      cierre = result.current.sesion._cerrarSesion();
    });
    await act(async () => me.resolver(meDeAna()));
    await act(async () => {
      fin.resolver();
      await cierre;
    });
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
    expect(base.datos.has('sesion')).toBe(false);
  });

  it('(b) login de otro usuario mientras me de la sesión anterior está en vuelo: no cambia almacén ni estado', async () => {
    const { repo, me } = repoControlado();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: serializarSesion(sesionDe('ana')) },
    });
    const { result } = await arrancar(dependencias);

    await act(() => result.current.sesion._cerrarSesion());
    await act(async () => {
      const r = await result.current.sesion._iniciarSesion({
        usuario: 'meli',
        pin: '1111',
      });
      expect(r.error).toBe(false);
    });
    const guardadaMeli = await dependencias.nativos.almacenSeguro.leer(
      'sesion',
    );
    expect(dependencias.sesionActiva.token()).toBe('token-meli');

    await act(async () => me.resolver(meDeAna()));
    await expect(
      dependencias.nativos.almacenSeguro.leer('sesion'),
    ).resolves.toBe(guardadaMeli);
    const estado = dependencias.sesionActiva.obtener();
    expect(estado.tipo).toBe('autenticado');
    expect(estado.tipo === 'autenticado' && estado.sesion.usuario.usuario).toBe(
      'meli',
    );
    expect(result.current.sesion.usuario?.nombre).toBe('Meli');
  });

  it('(b) con renew tardío de la sesión anterior tampoco se pisa la de meli', async () => {
    const { repo, me, renew } = repoControlado();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: {
        sesion: serializarSesion(
          sesionDe('ana', {
            renovarDesde: new Date(Date.now() - 1000).toISOString(),
          }),
        ),
      },
    });
    const { result } = await arrancar(dependencias);
    await act(async () => me.resolver(meDeAna()));
    await act(() => result.current.sesion._cerrarSesion());
    await act(async () => {
      await result.current.sesion._iniciarSesion({
        usuario: 'meli',
        pin: '1111',
      });
    });
    await act(async () =>
      renew.resolver(
        respuestaOk(
          {
            token: 'token-ana-renovado',
            expiraEn: new Date(Date.now() + 30 * DIA).toISOString(),
            renovarDesde: null,
          },
          200,
        ),
      ),
    );
    expect(dependencias.sesionActiva.token()).toBe('token-meli');
    expect((await leerGuardada(dependencias.nativos.almacenSeguro)).token).toBe(
      'token-meli',
    );
  });

  it('sin carreras, me tardío pero vigente sí actualiza almacén y estado (CA7)', async () => {
    const { repo, me } = repoControlado();
    const dependencias = crearDependenciasDePrueba({
      repo,
      almacenInicial: { sesion: serializarSesion(sesionDe('ana')) },
    });
    const { result } = await arrancar(dependencias);
    await act(async () => me.resolver(meDeAna()));
    expect(result.current.sesion.usuario?.nombre).toBe('Ana (tardía)');
    expect(
      (await leerGuardada(dependencias.nativos.almacenSeguro)).usuario.nombre,
    ).toBe('Ana (tardía)');
  });
});

/** Respuestas pendientes de todos los contenedores: se contestan al final de cada test. */
const sinContestar: Array<(status: number, cuerpo: unknown) => void> = [];
afterEach(async () => {
  // Sin esto, el temporizador de 15 s del cliente HTTP deja Jest abierto.
  await act(async () => {
    sinContestar.splice(0).forEach(responder => responder(500, {}));
  });
});

/** Contenedor con el cliente HTTP real y fetch diferido por petición, para el 401 tardío. */
function contenedorConFetchDiferido(almacenInicial: Record<string, string>) {
  const almacen = crearAlmacenEnMemoria(almacenInicial);
  const sesionActiva = crearSesionActiva();
  const pendientes: Array<{
    url: string;
    token: string | undefined;
    responder: (status: number, cuerpo: unknown) => void;
  }> = [];
  const fetchImpl = jest.fn(
    (url: string, init: RequestInit) =>
      new Promise<Response>(resolver => {
        const cabeceras = init.headers as Record<string, string>;
        const responder = (status: number, cuerpo: unknown) =>
          resolver({
            ok: status >= 200 && status < 300,
            status,
            text: () => Promise.resolve(JSON.stringify(cuerpo)),
          } as unknown as Response);
        sinContestar.push(responder);
        pendientes.push({
          url,
          token: cabeceras.Authorization?.replace('Bearer ', ''),
          responder,
        });
      }),
  );
  const api = crearClienteApi({
    urlBase: 'http://x/api',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    obtenerToken: () => Promise.resolve(sesionActiva.token()),
    alNoAutorizado: token => {
      invalidarSesionUseCase(almacen, sesionActiva, token);
    },
  });
  const dependencias: IDependencias = {
    repositorios: {
      sesion: crearApiSesionRepository(api, { etiquetaDispositivo: 't' }),
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
  return { dependencias, pendientes, almacen };
}

describe('401 tardío con token viejo (CA9)', () => {
  it('un 401 de me con el token de ana no invalida la sesión nueva de meli', async () => {
    const { dependencias, pendientes, almacen } = contenedorConFetchDiferido({
      sesion: serializarSesion(sesionDe('ana')),
    });
    const { result } = await arrancar(dependencias);
    const meAna = pendientes.find(p => p.url.includes('action=me'));
    expect(meAna?.token).toBe('token-ana');

    // Cierre: el logout responde ok.
    let cierre: Promise<void> = Promise.resolve();
    await act(async () => {
      cierre = result.current.sesion._cerrarSesion();
    });
    await act(async () => {
      pendientes
        .find(p => p.url.includes('action=logout'))
        ?.responder(200, { ok: true });
      await cierre;
    });
    // Login de meli con el cliente real.
    let login: Promise<unknown> = Promise.resolve();
    await act(async () => {
      login = result.current.sesion._iniciarSesion({
        usuario: 'meli',
        pin: '1111',
      });
    });
    await act(async () => {
      pendientes
        .find(p => p.url.endsWith('/auth.php'))
        ?.responder(200, {
          role: 'teacher',
          teacher: { id: 't1', name: 'Meli', username: 'meli' },
          token: 'token-meli',
          expiresAt: new Date(Date.now() + 30 * DIA).toISOString(),
          renewAfter: new Date(Date.now() + DIA).toISOString(),
        });
      await login;
    });
    expect(dependencias.sesionActiva.token()).toBe('token-meli');

    // Llega tarde el 401 del me de ana.
    await act(async () =>
      meAna?.responder(401, { error: 'Sesión revocada', code: 'revoked' }),
    );
    const estado = dependencias.sesionActiva.obtener();
    expect(estado.tipo).toBe('autenticado');
    expect(dependencias.sesionActiva.token()).toBe('token-meli');
    expect(JSON.parse(almacen.datos.get('sesion') ?? '{}').token).toBe(
      'token-meli',
    );
  });

  it('un 401 con el token de la sesión activa sí la invalida (vencida) y borra', async () => {
    const { dependencias, pendientes, almacen } = contenedorConFetchDiferido({
      sesion: serializarSesion(sesionDe('ana')),
    });
    await arrancar(dependencias);
    await act(async () =>
      pendientes
        .find(p => p.url.includes('action=me'))
        ?.responder(401, { error: 'Sesión revocada' }),
    );
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'vencida',
    });
    expect(almacen.datos.has('sesion')).toBe(false);
  });

  it('invalidarSesion: token distinto no hace nada; null (petición sin Bearer) tampoco con sesión', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
    const activa = crearSesionActiva({
      tipo: 'autenticado',
      sesion: sesionDe('meli'),
    });
    await invalidarSesionUseCase(almacen, activa, 'token-ana');
    expect(activa.token()).toBe('token-meli');
    await invalidarSesionUseCase(almacen, activa, null);
    expect(activa.token()).toBe('token-meli');
    expect(almacen.datos.has('sesion')).toBe(true);
    await invalidarSesionUseCase(almacen, activa, 'token-meli');
    expect(activa.obtener()).toEqual({ tipo: 'sinSesion', motivo: 'vencida' });
    expect(almacen.datos.has('sesion')).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Tester (F1-03, vuelta 2): el cierre con la marca «cerrando» y el cliente HTTP real.

/** Arranca con la sesión de ana y lanza el cierre; el logout queda pendiente. */
async function cerrarConLogoutPendiente() {
  const ctx = contenedorConFetchDiferido({
    sesion: serializarSesion(sesionDe('ana')),
  });
  const r = await arrancar(ctx.dependencias);
  let cierre: Promise<void> = Promise.resolve();
  await act(async () => {
    cierre = r.result.current.sesion._cerrarSesion();
  });
  const pendiente = (accion: string) =>
    ctx.pendientes.find(p => p.url.includes(`action=${accion}`));
  return { ...ctx, ...r, cierre: () => cierre, pendiente };
}

describe('cierre de sesión con el cliente HTTP real (vuelta 2)', () => {
  it('el logout sale con el Bearer de la sesión aunque ya no sea vigente', async () => {
    const { pendiente, dependencias, cierre } =
      await cerrarConLogoutPendiente();
    const logout = pendiente('logout');
    expect(logout?.token).toBe('token-ana');
    expect(dependencias.sesionActiva.esVigente('token-ana')).toBe(false);
    await act(async () => {
      logout?.responder(200, { ok: true });
      await cierre();
    });
  });

  it('me 200 durante el logout: no se guarda ni se publica, y al terminar el almacén queda vacío', async () => {
    const { pendiente, dependencias, almacen, result, cierre } =
      await cerrarConLogoutPendiente();
    await act(async () =>
      pendiente('me')?.responder(200, {
        role: 'student',
        expiresAt: new Date(Date.now() + 30 * DIA).toISOString(),
        student: { id: 's1', name: 'Ana (tardía)', username: 'ana' },
      }),
    );
    // Mientras sigue el logout, la sesión publicada no cambia y no se volvió a guardar.
    expect(result.current.sesion.usuario?.nombre).toBe('Ana Torres');
    await act(async () => {
      pendiente('logout')?.responder(200, { ok: true });
      await cierre();
    });
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
    expect(almacen.datos.has('sesion')).toBe(false);
  });

  it('el logout con 401 (sesión ya revocada) termina como cerrada, sin aviso de vencida, y borra', async () => {
    const { pendiente, dependencias, almacen, cierre } =
      await cerrarConLogoutPendiente();
    await act(async () => {
      pendiente('logout')?.responder(401, { error: 'Sesión revocada' });
      await cierre();
    });
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
    expect(almacen.datos.has('sesion')).toBe(false);
  });

  it('me 401 durante el cierre (token activo) tampoco deja el aviso de vencida al terminar', async () => {
    const { pendiente, dependencias, almacen, cierre } =
      await cerrarConLogoutPendiente();
    await act(async () =>
      pendiente('me')?.responder(401, { error: 'Sesión revocada' }),
    );
    await act(async () => {
      pendiente('logout')?.responder(200, { ok: true });
      await cierre();
    });
    expect(dependencias.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
    expect(almacen.datos.has('sesion')).toBe(false);
  });

  it('tras cerrar, un login nuevo es vigente y su me posterior sí se guarda (la marca no se queda pegada)', async () => {
    const { pendiente, dependencias, almacen, result, cierre, pendientes } =
      await cerrarConLogoutPendiente();
    await act(async () => {
      pendiente('logout')?.responder(200, { ok: true });
      await cierre();
    });
    let login: Promise<unknown> = Promise.resolve();
    await act(async () => {
      login = result.current.sesion._iniciarSesion({
        usuario: 'meli',
        pin: '1111',
      });
    });
    await act(async () => {
      pendientes
        .find(p => p.url.endsWith('/auth.php'))
        ?.responder(200, {
          role: 'teacher',
          teacher: { id: 't1', name: 'Meli', username: 'meli' },
          token: 'token-meli',
          expiresAt: new Date(Date.now() + 30 * DIA).toISOString(),
          renewAfter: null,
        });
      await login;
    });
    expect(dependencias.sesionActiva.esVigente('token-meli')).toBe(true);
    expect(JSON.parse(almacen.datos.get('sesion') ?? '{}').token).toBe(
      'token-meli',
    );
  });
});
