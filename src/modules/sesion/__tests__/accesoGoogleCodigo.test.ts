// F1-06: código por correo (doble factor) y login con Google. Dominio, casos de uso y adaptadores
// (auth.php con fetch falso, repositorio en memoria y SDK de Google mockeado en jest.setup.ts).
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { crearAlmacenEnMemoria } from '@/app/di/dependenciasDePrueba';
import { iniciarConGoogleUseCase } from '@/modules/sesion/aplications/iniciarConGoogle/iniciarConGoogle';
import { iniciarSesionUseCase } from '@/modules/sesion/aplications/iniciarSesion/iniciarSesion';
import {
  reenviarCodigoUseCase,
  verificarCodigoUseCase,
} from '@/modules/sesion/aplications/verificarCodigo/verificarCodigo';
import type {
  IDesafioCodigo,
  IResponseSesion,
} from '@/modules/sesion/domain/entities/Sesion.entities';
import { mensajesSesion } from '@/modules/sesion/domain/sesion.mensajes';
import {
  agregarDigito,
  esDesafio,
  LONGITUD_CODIGO,
  validarCodigo,
} from '@/modules/sesion/domain/validations/sesion.validations';
import { crearApiSesionRepository } from '@/modules/sesion/infrastructure/apiSesionRepository';
import {
  CODIGO_MEMORIA,
  crearMemoriaSesionRepository,
  tokenGoogleMemoria,
  USUARIOS_SEED,
} from '@/modules/sesion/infrastructure/memoriaSesionRepository';
import {
  crearGoogleSignInAdapter,
  MENSAJES_GOOGLE,
} from '@/native/adapters/GoogleSignInAdapter';
import type { GoogleSignInPort } from '@/native/ports/GoogleSignInPort';
import { crearClienteApi } from '@/shared/lib/api';

const CON_CORREO = USUARIOS_SEED.map(u =>
  u.usuario === 'ana' || u.usuario === 'meli'
    ? { ...u, correo: `${u.usuario}@example.com` }
    : u,
);
const repoConCorreo = () =>
  crearMemoriaSesionRepository({ usuarios: CON_CORREO });

async function desafioDe(usuario = 'ana', pin = '1234') {
  const repo = repoConCorreo();
  const r = await repo.iniciarSesion({ usuario, pin });
  return { repo, desafio: r.response as IDesafioCodigo };
}

describe('dominio del código', () => {
  it('validarCodigo exige exactamente 6 dígitos', () => {
    expect(validarCodigo('123456')).toBeNull();
    for (const malo of ['12345', '1234567', '12a456', '', ' 123456']) {
      expect(validarCodigo(malo)).toBe(mensajesSesion.codigoInvalido);
    }
    expect(LONGITUD_CODIGO).toBe(6);
  });

  it('agregarDigito respeta el máximo pedido (PIN 4 por defecto, código 6)', () => {
    expect(agregarDigito('1234', '5')).toBe('1234');
    expect(agregarDigito('1234', '5', 6)).toBe('12345');
    expect(agregarDigito('123456', '7', 6)).toBe('123456');
  });

  it('esDesafio distingue el desafío de la sesión', async () => {
    const { desafio } = await desafioDe();
    expect(esDesafio(desafio)).toBe(true);
    const sesion = await crearMemoriaSesionRepository().iniciarSesion({
      usuario: 'ana',
      pin: '1234',
    });
    expect(esDesafio(sesion.response as IResponseSesion)).toBe(false);
  });
});

describe('casos de uso con el código por correo', () => {
  it('login con correo: devuelve el desafío y NO guarda nada todavía', async () => {
    const almacen = crearAlmacenEnMemoria();
    const r = await iniciarSesionUseCase(repoConCorreo(), almacen, {
      usuario: 'ANA',
      pin: '1234',
    });
    expect(r.error).toBe(false);
    expect(r.response).toMatchObject({
      requiereCodigo: true,
      correoEnmascarado: 'an***@example.com',
      longitud: 6,
      reenviarEnSeg: 60,
    });
    expect(almacen.datos.size).toBe(0);
  });

  it('verificar: valida sin llamar al repo y, con el código bueno, guarda la sesión', async () => {
    const { repo, desafio } = await desafioDe();
    const espia = jest.spyOn(repo, 'verificarCodigo');
    const almacen = crearAlmacenEnMemoria();
    const malo = await verificarCodigoUseCase(repo, almacen, {
      desafio: desafio.desafio,
      codigo: '12',
    });
    expect(malo.msg).toBe(mensajesSesion.codigoInvalido);
    expect(espia).not.toHaveBeenCalled();

    const r = await verificarCodigoUseCase(repo, almacen, {
      desafio: desafio.desafio,
      codigo: CODIGO_MEMORIA,
    });
    expect(r.response?.usuario).toMatchObject({ usuario: 'ana' });
    const guardada = JSON.parse(almacen.datos.get('sesion') ?? '{}');
    expect(guardada.token).toBe(r.response?.token);
    expect(JSON.stringify(guardada)).not.toContain(CODIGO_MEMORIA);
  });

  it('verificar: código malo 401 sin guardar; desafío usado o desconocido 410', async () => {
    const { repo, desafio } = await desafioDe();
    const almacen = crearAlmacenEnMemoria();
    const args = { desafio: desafio.desafio, codigo: '000000' };
    expect(await verificarCodigoUseCase(repo, almacen, args)).toMatchObject({
      error: true,
      code: 401,
    });
    expect(almacen.datos.size).toBe(0);
    await verificarCodigoUseCase(repo, almacen, {
      ...args,
      codigo: CODIGO_MEMORIA,
    });
    expect(
      await verificarCodigoUseCase(repo, almacen, {
        ...args,
        codigo: CODIGO_MEMORIA,
      }),
    ).toMatchObject({ error: true, code: 410 });
  });

  it('verificar: si el almacén falla, no hay sesión (P9)', async () => {
    const { repo, desafio } = await desafioDe();
    const almacen = {
      ...crearAlmacenEnMemoria(),
      guardar: () => Promise.resolve(false),
    };
    const r = await verificarCodigoUseCase(repo, almacen, {
      desafio: desafio.desafio,
      codigo: CODIGO_MEMORIA,
    });
    expect(r).toMatchObject({ error: true, msg: mensajesSesion.noSeGuardo });
  });

  it('reenviar: responde mientras el desafío existe y 410 si no', async () => {
    const { repo, desafio } = await desafioDe();
    expect(
      (await reenviarCodigoUseCase(repo, desafio.desafio)).response,
    ).toMatchObject({ reenviarEnSeg: 60 });
    expect(await reenviarCodigoUseCase(repo, 'otro')).toMatchObject({
      error: true,
      code: 410,
    });
  });
});

describe('caso de uso de Google', () => {
  const google = (
    resultado: Awaited<ReturnType<GoogleSignInPort['obtenerIdToken']>>,
  ) => ({
    disponible: true,
    obtenerIdToken: jest.fn(() => Promise.resolve(resultado)),
    cerrarSesion: jest.fn(() => Promise.resolve()),
  });

  it('cancelado: no llama a Leap ni guarda', async () => {
    const repo = repoConCorreo();
    const espia = jest.spyOn(repo, 'iniciarConGoogle');
    const r = await iniciarConGoogleUseCase(
      repo,
      crearAlmacenEnMemoria(),
      google({ tipo: 'cancelado' }),
    );
    expect(r).toEqual({ tipo: 'cancelado' });
    expect(espia).not.toHaveBeenCalled();
  });

  it('error del selector: lo devuelve como respuesta legible', async () => {
    const r = await iniciarConGoogleUseCase(
      repoConCorreo(),
      crearAlmacenEnMemoria(),
      google({ tipo: 'error', mensaje: 'sin Play Services' }),
    );
    expect(r).toMatchObject({
      tipo: 'respuesta',
      respuesta: { error: true, msg: 'sin Play Services' },
    });
  });

  it('correo registrado: entra y guarda la sesión sin pedir código', async () => {
    const almacen = crearAlmacenEnMemoria();
    const g = google({ tipo: 'ok', idToken: tokenGoogleMemoria('meli') });
    const r = await iniciarConGoogleUseCase(repoConCorreo(), almacen, g);
    expect(r.tipo === 'respuesta' && r.respuesta.response?.usuario).toEqual({
      id: 't025ce0c8974fad25',
      nombre: 'Meli',
      usuario: 'meli',
      rol: 'profe',
    });
    expect(almacen.datos.has('sesion')).toBe(true);
    expect(g.cerrarSesion).not.toHaveBeenCalled();
  });

  it('correo no registrado: error y se olvida la cuenta de Google para elegir otra', async () => {
    const almacen = crearAlmacenEnMemoria();
    const g = google({ tipo: 'ok', idToken: tokenGoogleMemoria('luis') });
    const r = await iniciarConGoogleUseCase(repoConCorreo(), almacen, g);
    expect(r).toMatchObject({
      tipo: 'respuesta',
      respuesta: { error: true, code: 404 },
    });
    expect(almacen.datos.size).toBe(0);
    expect(g.cerrarSesion).toHaveBeenCalledTimes(1);
  });
});

// ── auth.php con fetch falso ─────────────────────────────────

function montarApi(status: number, cuerpo: unknown) {
  const fetchImpl = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(JSON.stringify(cuerpo)),
    } as unknown as Response),
  );
  const api = crearClienteApi({
    urlBase: 'http://localhost:8080/api',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    obtenerToken: () => Promise.resolve(null),
  });
  const repo = crearApiSesionRepository(api, { etiquetaDispositivo: 'g77' });
  const llamada = () => {
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    return { url, cuerpo: JSON.parse(String(init.body)) };
  };
  return { repo, llamada };
}

const LOGIN_OK = {
  role: 'student',
  student: { id: 's1', name: 'Ana Torres', username: 'ana' },
  token: 'a'.repeat(64),
  expiresAt: '2026-12-16T12:00:00Z',
  renewAfter: '2026-11-17T12:00:00Z',
};

describe('apiSesionRepository · F1-06', () => {
  it('login con requiresCode → desafío con los nombres del dominio', async () => {
    const { repo } = montarApi(200, {
      requiresCode: true,
      challenge: 'c'.repeat(64),
      emailMasked: 'an***@gmail.com',
      codeLength: 6,
      resendAfter: 45,
    });
    const r = await repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r.response).toEqual({
      requiereCodigo: true,
      desafio: 'c'.repeat(64),
      correoEnmascarado: 'an***@gmail.com',
      longitud: 6,
      reenviarEnSeg: 45,
    });
  });

  it('requiresCode sin challenge es un error legible; sin extras usa los valores por defecto', async () => {
    const sinDesafio = montarApi(200, { requiresCode: true });
    expect(
      await sinDesafio.repo.iniciarSesion({ usuario: 'ana', pin: '1234' }),
    ).toMatchObject({ error: true, msg: mensajesSesion.desafioInvalido });

    const minimo = montarApi(200, { requiresCode: true, challenge: 'x' });
    const r = await minimo.repo.iniciarSesion({ usuario: 'ana', pin: '1234' });
    expect(r.response).toMatchObject({
      correoEnmascarado: '',
      longitud: 6,
      reenviarEnSeg: 60,
    });
  });

  it('verify_code: POST con challenge y code; devuelve la sesión', async () => {
    const { repo, llamada } = montarApi(200, LOGIN_OK);
    const r = await repo.verificarCodigo({ desafio: 'd', codigo: '123456' });
    expect(llamada().url).toContain('auth.php?action=verify_code');
    expect(llamada().cuerpo).toEqual({ challenge: 'd', code: '123456' });
    expect(r.response?.usuario).toMatchObject({
      usuario: 'ana',
      rol: 'estudiante',
    });
  });

  it('verify_code: el 410 del desafío vencido se propaga con su código', async () => {
    const { repo } = montarApi(410, {
      error: 'El código venció. Vuelve a iniciar sesión.',
      code: 'challenge_invalid',
    });
    expect(
      await repo.verificarCodigo({ desafio: 'd', codigo: '123456' }),
    ).toMatchObject({
      error: true,
      code: 410,
      msg: 'El código venció. Vuelve a iniciar sesión.',
    });
  });

  it('resend_code: POST con challenge; mapea correo y espera (con valores por defecto)', async () => {
    const { repo, llamada } = montarApi(200, {
      ok: true,
      emailMasked: 'an***@gmail.com',
      resendAfter: 60,
    });
    expect((await repo.reenviarCodigo('d')).response).toEqual({
      correoEnmascarado: 'an***@gmail.com',
      reenviarEnSeg: 60,
    });
    expect(llamada().url).toContain('action=resend_code');
    expect(llamada().cuerpo).toEqual({ challenge: 'd' });
    const vacio = montarApi(200, { ok: true });
    expect((await vacio.repo.reenviarCodigo('d')).response).toEqual({
      correoEnmascarado: '',
      reenviarEnSeg: 60,
    });
    const espera = montarApi(429, { error: 'Espera 30 s', code: 'too_soon' });
    expect(await espera.repo.reenviarCodigo('d')).toMatchObject({
      error: true,
      code: 429,
    });
  });

  it('google: POST con idToken, client app y deviceLabel; devuelve la sesión', async () => {
    const { repo, llamada } = montarApi(200, LOGIN_OK);
    const r = await repo.iniciarConGoogle('id-token');
    expect(llamada().url).toContain('action=google');
    expect(llamada().cuerpo).toEqual({
      idToken: 'id-token',
      client: 'app',
      deviceLabel: 'g77',
    });
    expect(r.response?.token).toBe('a'.repeat(64));
  });

  it('google: el 404 de correo no registrado llega con el mensaje de Leap', async () => {
    const { repo } = montarApi(404, {
      error: 'Tu correo no está registrado en la academia.',
      code: 'google_no_account',
    });
    expect(await repo.iniciarConGoogle('t')).toMatchObject({
      error: true,
      code: 404,
      msg: 'Tu correo no está registrado en la academia.',
    });
  });
});

describe('GoogleSignInAdapter', () => {
  const signIn = GoogleSignin.signIn as jest.Mock;

  beforeEach(() => jest.clearAllMocks());

  it('sin webClientId: no disponible y no toca el SDK', async () => {
    const g = crearGoogleSignInAdapter({ webClientId: null });
    expect(g.disponible).toBe(false);
    expect(await g.obtenerIdToken()).toEqual({
      tipo: 'error',
      mensaje: MENSAJES_GOOGLE.generico,
    });
    await g.cerrarSesion();
    expect(GoogleSignin.configure).not.toHaveBeenCalled();
  });

  it('configura una vez con el webClientId y devuelve el ID token', async () => {
    const g = crearGoogleSignInAdapter({ webClientId: 'web-id' });
    expect(g.disponible).toBe(true);
    expect(await g.obtenerIdToken()).toEqual({
      tipo: 'ok',
      idToken: 'mockIdToken',
    });
    await g.obtenerIdToken();
    expect(GoogleSignin.configure).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web-id',
      iosClientId: undefined,
    });
  });

  it('cancelado (respuesta o código) no es un error', async () => {
    const g = crearGoogleSignInAdapter({ webClientId: 'web-id' });
    signIn.mockResolvedValueOnce({ type: 'cancelled', data: null });
    expect(await g.obtenerIdToken()).toEqual({ tipo: 'cancelado' });
    signIn.mockRejectedValueOnce({ code: statusCodes.SIGN_IN_CANCELLED });
    expect(await g.obtenerIdToken()).toEqual({ tipo: 'cancelado' });
    signIn.mockRejectedValueOnce({ code: statusCodes.IN_PROGRESS });
    expect(await g.obtenerIdToken()).toEqual({ tipo: 'cancelado' });
  });

  it('sin idToken, sin Play Services o error desconocido: mensajes legibles', async () => {
    const g = crearGoogleSignInAdapter({ webClientId: 'web-id' });
    signIn.mockResolvedValueOnce({ type: 'success', data: { idToken: null } });
    expect(await g.obtenerIdToken()).toEqual({
      tipo: 'error',
      mensaje: MENSAJES_GOOGLE.sinToken,
    });
    signIn.mockRejectedValueOnce({
      code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
    });
    expect(await g.obtenerIdToken()).toEqual({
      tipo: 'error',
      mensaje: MENSAJES_GOOGLE.playServices,
    });
    signIn.mockRejectedValueOnce(new Error('boom'));
    expect(await g.obtenerIdToken()).toEqual({
      tipo: 'error',
      mensaje: MENSAJES_GOOGLE.generico,
    });
  });

  it('cerrarSesion: solo cierra si había cuenta y nunca rechaza', async () => {
    const g = crearGoogleSignInAdapter({ webClientId: 'web-id' });
    await g.cerrarSesion();
    expect(GoogleSignin.signOut).not.toHaveBeenCalled();
    (GoogleSignin.hasPreviousSignIn as jest.Mock).mockReturnValueOnce(true);
    await g.cerrarSesion();
    expect(GoogleSignin.signOut).toHaveBeenCalledTimes(1);
    (GoogleSignin.hasPreviousSignIn as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    await expect(g.cerrarSesion()).resolves.toBeUndefined();
  });
});
