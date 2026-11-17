// Constructor (F1-03): casos de uso de sesión con repositorio y almacén falsos. El tester amplía
// los casos de cada criterio en sus propios archivos.
import { crearAlmacenEnMemoria } from '@/app/di/dependenciasDePrueba';
import { arrancarSesionUseCase } from '@/modules/sesion/aplications/arrancarSesion/arrancarSesion';
import { cerrarSesionUseCase } from '@/modules/sesion/aplications/cerrarSesion/cerrarSesion';
import { iniciarSesionUseCase } from '@/modules/sesion/aplications/iniciarSesion/iniciarSesion';
import { invalidarSesionUseCase } from '@/modules/sesion/aplications/invalidarSesion/invalidarSesion';
import { crearRenovadorSesion } from '@/modules/sesion/aplications/renovarSesion/renovarSesion';
import { restaurarSesionUseCase } from '@/modules/sesion/aplications/restaurarSesion/restaurarSesion';
import { crearSesionActiva } from '@/modules/sesion/aplications/sesionActiva';
import { validarSesionUseCase } from '@/modules/sesion/aplications/validarSesion/validarSesion';
import type { IResponseSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import type { SesionRepository } from '@/modules/sesion/domain/models/SesionRepository';
import { mensajesSesion } from '@/modules/sesion/domain/sesion.mensajes';
import { serializarSesion } from '@/modules/sesion/domain/validations/sesion.validations';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

const sesion: IResponseSesion = {
  token: 'viejo',
  expiraEn: '2026-12-01T00:00:00Z',
  renovarDesde: '2026-11-17T00:00:00Z',
  usuario: { id: 's1', nombre: 'Ana', usuario: 'ana', rol: 'estudiante' },
};
const ahora = new Date('2026-11-16T12:00:00Z');

function repoFalso(parcial: Partial<SesionRepository> = {}) {
  return {
    iniciarSesion: jest.fn(() => Promise.resolve(respuestaOk(sesion))),
    obtenerUsuarioActual: jest.fn(() =>
      Promise.resolve(
        respuestaOk({
          usuario: { ...sesion.usuario, nombre: 'Ana Torres' },
          expiraEn: '2026-12-15T00:00:00Z',
        }),
      ),
    ),
    renovar: jest.fn(() =>
      Promise.resolve(
        respuestaOk({
          token: 'nuevo',
          expiraEn: '2026-12-20T00:00:00Z',
          renovarDesde: '2026-11-18T00:00:00Z',
        }),
      ),
    ),
    cerrarSesion: jest.fn(() => Promise.resolve(respuestaOk<void>(undefined))),
    ...parcial,
  };
}

const guardadaEn = (almacen: ReturnType<typeof crearAlmacenEnMemoria>) =>
  JSON.parse(almacen.datos.get('sesion') ?? 'null');

describe('iniciarSesionUseCase', () => {
  it('valida sin llamar al repo', async () => {
    const repo = repoFalso();
    const r = await iniciarSesionUseCase(repo, crearAlmacenEnMemoria(), {
      usuario: ' ',
      pin: '1234',
    });
    expect(r).toMatchObject({ error: true, msg: mensajesSesion.usuarioVacio });
    const r2 = await iniciarSesionUseCase(repo, crearAlmacenEnMemoria(), {
      usuario: 'ana',
      pin: '12',
    });
    expect(r2.msg).toBe(mensajesSesion.pinInvalido);
    expect(repo.iniciarSesion).not.toHaveBeenCalled();
  });

  it('normaliza, guarda el JSON sin PIN y devuelve la sesión', async () => {
    const repo = repoFalso();
    const almacen = crearAlmacenEnMemoria();
    const r = await iniciarSesionUseCase(repo, almacen, {
      usuario: '  ANA ',
      pin: '1234',
    });
    expect(repo.iniciarSesion).toHaveBeenCalledWith({
      usuario: 'ana',
      pin: '1234',
    });
    expect(r).toMatchObject({ error: false, response: sesion });
    expect(guardadaEn(almacen)).toEqual({ version: 1, ...sesion });
    expect(almacen.datos.get('sesion')).not.toMatch(/1234/);
  });

  it('con error del repo no guarda', async () => {
    const almacen = crearAlmacenEnMemoria();
    const r = await iniciarSesionUseCase(
      repoFalso({
        iniciarSesion: () =>
          Promise.resolve(respuestaError('Usuario o PIN incorrecto', 401)),
      }),
      almacen,
      { usuario: 'ana', pin: '0000' },
    );
    expect(r).toMatchObject({ error: true, code: 401 });
    expect(almacen.datos.size).toBe(0);
  });

  it('si el almacén no guarda, falla (P9)', async () => {
    const almacen = {
      ...crearAlmacenEnMemoria(),
      guardar: () => Promise.resolve(false),
    };
    const r = await iniciarSesionUseCase(repoFalso(), almacen, {
      usuario: 'ana',
      pin: '1234',
    });
    expect(r).toMatchObject({ error: true, msg: mensajesSesion.noSeGuardo });
  });
});

describe('restaurarSesionUseCase', () => {
  it('sin dato devuelve null', async () => {
    await expect(
      restaurarSesionUseCase(crearAlmacenEnMemoria(), ahora),
    ).resolves.toBeNull();
  });

  it.each([
    ['corrupta', 'no json'],
    [
      'vencida',
      serializarSesion({ ...sesion, expiraEn: '2026-11-01T00:00:00Z' }),
    ],
  ])('%s: la borra y devuelve null', async (_caso, texto) => {
    const almacen = crearAlmacenEnMemoria({ sesion: texto });
    await expect(restaurarSesionUseCase(almacen, ahora)).resolves.toBeNull();
    expect(almacen.datos.has('sesion')).toBe(false);
  });

  it('vigente: la devuelve sin la versión', async () => {
    const almacen = crearAlmacenEnMemoria({ sesion: serializarSesion(sesion) });
    await expect(restaurarSesionUseCase(almacen, ahora)).resolves.toEqual(
      sesion,
    );
  });
});

describe('validarSesionUseCase', () => {
  it('con 200 fusiona usuario y expiración y guarda', async () => {
    const almacen = crearAlmacenEnMemoria();
    const r = await validarSesionUseCase(repoFalso(), almacen, sesion);
    expect(r.response).toMatchObject({
      token: 'viejo',
      expiraEn: '2026-12-15T00:00:00Z',
      usuario: { nombre: 'Ana Torres', usuario: 'ana' },
    });
    expect(guardadaEn(almacen).usuario.nombre).toBe('Ana Torres');
  });

  it('si me no trae usuario, conserva el guardado', async () => {
    const repo = repoFalso({
      obtenerUsuarioActual: () =>
        Promise.resolve(
          respuestaOk({
            usuario: { ...sesion.usuario, usuario: '' },
            expiraEn: sesion.expiraEn,
          }),
        ),
    });
    const r = await validarSesionUseCase(repo, crearAlmacenEnMemoria(), sesion);
    expect(r.response?.usuario.usuario).toBe('ana');
  });

  it.each([0, 500])('con error %p conserva la sesión', async code => {
    const almacen = crearAlmacenEnMemoria();
    const repo = repoFalso({
      obtenerUsuarioActual: () => Promise.resolve(respuestaError('x', code)),
    });
    const r = await validarSesionUseCase(repo, almacen, sesion);
    expect(r).toEqual({ error: false, response: sesion, code: undefined });
    expect(almacen.datos.size).toBe(0);
  });

  it('con 401 devuelve el error', async () => {
    const repo = repoFalso({
      obtenerUsuarioActual: () => Promise.resolve(respuestaError('no', 401)),
    });
    const r = await validarSesionUseCase(repo, crearAlmacenEnMemoria(), sesion);
    expect(r).toMatchObject({ error: true, code: 401 });
  });
});

describe('crearRenovadorSesion', () => {
  it('dos llamadas a la vez hacen un solo renew y guardan el token nuevo', async () => {
    const respuesta = respuestaOk({
      token: 'nuevo',
      expiraEn: '2026-12-20T00:00:00Z',
      renovarDesde: '2026-11-18T00:00:00Z',
    });
    let resolver!: (r: typeof respuesta) => void;
    const renovarMock = jest.fn(() => Promise.resolve(respuesta));
    renovarMock.mockImplementationOnce(
      () =>
        new Promise<typeof respuesta>(res => {
          resolver = res;
        }),
    );
    const repo = repoFalso({ renovar: renovarMock });
    const almacen = crearAlmacenEnMemoria();
    const renovar = crearRenovadorSesion();
    const a = renovar(repo, almacen, sesion);
    const b = renovar(repo, almacen, sesion);
    expect(renovarMock).toHaveBeenCalledTimes(1);
    resolver(respuesta);
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toBe(rb);
    expect(ra.response).toMatchObject({
      token: 'nuevo',
      usuario: sesion.usuario,
    });
    expect(guardadaEn(almacen).token).toBe('nuevo');
    // Terminada la primera, otra llamada vuelve a renovar.
    await renovar(repo, almacen, sesion);
    expect(renovarMock).toHaveBeenCalledTimes(2);
  });

  it('sin red conserva el token actual; con 401 devuelve el error', async () => {
    const renovar = crearRenovadorSesion();
    const sinRed = repoFalso({
      renovar: () => Promise.resolve(respuestaError('red', 0)),
    });
    const r = await renovar(sinRed, crearAlmacenEnMemoria(), sesion);
    expect(r).toMatchObject({ error: false, response: sesion });
    const revocada = repoFalso({
      renovar: () => Promise.resolve(respuestaError('no', 401)),
    });
    const r2 = await renovar(revocada, crearAlmacenEnMemoria(), sesion);
    expect(r2).toMatchObject({ error: true, code: 401 });
  });
});

describe('cerrarSesionUseCase', () => {
  it('llama a logout y borra', async () => {
    const repo = repoFalso();
    const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
    await expect(cerrarSesionUseCase(repo, almacen)).resolves.toMatchObject({
      error: false,
    });
    expect(repo.cerrarSesion).toHaveBeenCalledTimes(1);
    expect(almacen.datos.size).toBe(0);
  });

  it('si logout no responde, borra al cumplirse el límite', async () => {
    jest.useFakeTimers();
    try {
      const repo = repoFalso({ cerrarSesion: () => new Promise(() => {}) });
      const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
      const promesa = cerrarSesionUseCase(repo, almacen, 3000);
      await jest.advanceTimersByTimeAsync(3000);
      await promesa;
      expect(almacen.datos.size).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('si logout rechaza, borra igual', async () => {
    const repo = repoFalso({ cerrarSesion: () => Promise.reject(new Error()) });
    const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
    await cerrarSesionUseCase(repo, almacen);
    expect(almacen.datos.size).toBe(0);
  });
});

describe('invalidarSesionUseCase', () => {
  it('sin sesión activa no hace nada', async () => {
    const activa = crearSesionActiva({ tipo: 'sinSesion' });
    const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
    await invalidarSesionUseCase(almacen, activa);
    expect(activa.obtener()).toEqual({ tipo: 'sinSesion' });
    expect(almacen.datos.size).toBe(1);
  });

  it('con sesión pasa a vencida y borra', async () => {
    const activa = crearSesionActiva({ tipo: 'autenticado', sesion });
    const almacen = crearAlmacenEnMemoria({ sesion: 'x' });
    await invalidarSesionUseCase(almacen, activa);
    expect(activa.obtener()).toEqual({ tipo: 'sinSesion', motivo: 'vencida' });
    expect(almacen.datos.size).toBe(0);
  });
});

describe('crearSesionActiva', () => {
  it('avisa a los oyentes y da el token solo con sesión', () => {
    const activa = crearSesionActiva();
    const oyente = jest.fn();
    const quitar = activa.suscribir(oyente);
    expect(activa.token()).toBeNull();
    activa.establecer({ tipo: 'autenticado', sesion });
    expect(activa.token()).toBe('viejo');
    quitar();
    activa.establecer({ tipo: 'sinSesion' });
    expect(oyente).toHaveBeenCalledTimes(1);
  });
});

describe('arrancarSesionUseCase', () => {
  const args = (repo: SesionRepository, texto?: string) => ({
    repo,
    almacen: crearAlmacenEnMemoria(texto ? { sesion: texto } : {}),
    sesionActiva: crearSesionActiva(),
    renovar: crearRenovadorSesion(),
    ahora,
  });

  it('sin sesión guardada pasa a sinSesion sin red', async () => {
    const repo = repoFalso();
    const a = args(repo);
    await arrancarSesionUseCase(a);
    expect(a.sesionActiva.obtener()).toEqual({ tipo: 'sinSesion' });
    expect(repo.obtenerUsuarioActual).not.toHaveBeenCalled();
  });

  it('valida con un solo me y publica la sesión actualizada', async () => {
    const repo = repoFalso();
    const a = args(repo, serializarSesion(sesion));
    await arrancarSesionUseCase(a);
    expect(repo.obtenerUsuarioActual).toHaveBeenCalledTimes(1);
    expect(repo.renovar).not.toHaveBeenCalled();
    expect(a.sesionActiva.token()).toBe('viejo');
    const estado = a.sesionActiva.obtener();
    expect(estado.tipo === 'autenticado' && estado.sesion.usuario.nombre).toBe(
      'Ana Torres',
    );
  });

  it('si toca, renueva y publica el token nuevo', async () => {
    const repo = repoFalso();
    const a = {
      ...args(repo, serializarSesion(sesion)),
      ahora: new Date('2026-11-17T12:00:00Z'),
    };
    await arrancarSesionUseCase(a);
    expect(repo.renovar).toHaveBeenCalledTimes(1);
    expect(a.sesionActiva.token()).toBe('nuevo');
  });

  it('si validar o renovar fallan con 401 no publica nada más', async () => {
    const repo = repoFalso({
      obtenerUsuarioActual: () => Promise.resolve(respuestaError('no', 401)),
    });
    const a = args(repo, serializarSesion(sesion));
    await arrancarSesionUseCase(a);
    expect(a.sesionActiva.token()).toBe('viejo');

    const repo2 = repoFalso({
      renovar: () => Promise.resolve(respuestaError('no', 401)),
    });
    const b = {
      ...args(repo2, serializarSesion(sesion)),
      ahora: new Date('2026-11-17T12:00:00Z'),
    };
    await arrancarSesionUseCase(b);
    expect(b.sesionActiva.token()).toBe('viejo');
  });

  it('si la sesión se cerró mientras validaba, no la reabre', async () => {
    const a = args(repoFalso(), serializarSesion(sesion));
    const repo = repoFalso({
      obtenerUsuarioActual: async () => {
        a.sesionActiva.establecer({ tipo: 'sinSesion', motivo: 'cerrada' });
        return respuestaOk({
          usuario: sesion.usuario,
          expiraEn: sesion.expiraEn,
        });
      },
    });
    await arrancarSesionUseCase({ ...a, repo });
    expect(a.sesionActiva.obtener()).toEqual({
      tipo: 'sinSesion',
      motivo: 'cerrada',
    });
  });
});
