// F3-01: dominio, casos de uso y adaptador del chat. Hoy es mar 17 nov 2026, 10:00 en Bogotá.
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import { obtenerBandejaUseCase } from '../aplications/bandeja/bandeja';
import {
  enviarMensajeUseCase,
  marcarLeidoUseCase,
  obtenerHiloUseCase,
  reaccionarUseCase,
} from '../aplications/hilo/hilo';
import type {
  IMensajeChat,
  IResponseMensaje,
} from '../domain/entities/Mensajes.entities';
import {
  ayerDe,
  combinarHilo,
  fechaDeMarca,
  filasDelHilo,
  horaDeMarca,
  marcaDeInstante,
  MAX_TEXTO,
  miReactor,
  noLeidosDelOtro,
  normalizarEmoji,
  problemaDelTexto,
  resumenReacciones,
  ultimoIdServidor,
} from '../domain/validations/mensajes.validations';
import {
  crearApiMensajesRepository,
  estadoDe,
  mensajeDe,
  reaccionesDe,
} from '../infrastructure/apiMensajesRepository';
import { crearMemoriaMensajesRepository } from '../infrastructure/memoriaMensajesRepository';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);

export const msg = (m: Partial<IResponseMensaje>): IResponseMensaje => ({
  id: 1,
  idEstudiante: 'e1',
  remitente: 'student',
  nombre: 'Ana',
  texto: 'Hola',
  tieneImagen: false,
  tieneVoz: false,
  leido: false,
  editado: false,
  reacciones: {},
  creado: '2026-11-17 09:30:00',
  mio: true,
  ...m,
});

describe('dominio', () => {
  it('problemaDelTexto: vacío, largo o enviable', () => {
    expect(problemaDelTexto('')).toBe('vacio');
    expect(problemaDelTexto('   ')).toBe('vacio');
    expect(problemaDelTexto('a'.repeat(MAX_TEXTO + 1))).toBe('largo');
    expect(problemaDelTexto('a'.repeat(MAX_TEXTO))).toBeNull();
    expect(problemaDelTexto(' Hola ')).toBeNull();
  });

  it('normalizarEmoji quita el selector de variación', () => {
    expect(normalizarEmoji('❤️')).toBe('❤');
    expect(normalizarEmoji('👍')).toBe('👍');
  });

  it('combinarHilo une sin duplicar, ordena y aplica el estado', () => {
    const a = msg({ id: 2 });
    const b = msg({ id: 1 });
    const unidos = combinarHilo(
      [a, b],
      [msg({ id: 3 }), msg({ id: 2, texto: 'nuevo' })],
      [
        { id: 1, leido: true, editado: true, reacciones: { '👍': ['x'] } },
        { id: 99, leido: true, editado: false, reacciones: {} },
      ],
    );
    expect(unidos.map(m => m.id)).toEqual([1, 2, 3]);
    expect(unidos[0]).toMatchObject({
      leido: true,
      editado: true,
      reacciones: { '👍': ['x'] },
    });
    expect(unidos[1].texto).toBe('nuevo');
    expect(combinarHilo([a], [])).toEqual([a]);
  });

  it('ultimoIdServidor y noLeidosDelOtro', () => {
    expect(ultimoIdServidor([])).toBe(0);
    expect(ultimoIdServidor([msg({ id: 4 }), msg({ id: 9 })])).toBe(9);
    expect(
      noLeidosDelOtro([
        msg({ mio: false, leido: false }),
        msg({ mio: false, leido: true }),
        msg({ mio: true, leido: false }),
      ]),
    ).toBe(1);
  });

  it('fecha y hora de la marca, y la marca de un instante en Bogotá', () => {
    expect(fechaDeMarca('2026-11-17 09:30:00')).toBe('2026-11-17');
    expect(horaDeMarca('2026-11-17 09:30:00')).toBe('09:30');
    expect(marcaDeInstante(AHORA)).toBe('2026-11-17 10:00:00');
  });

  it('ayerDe cruza el mes y devuelve lo que no es fecha', () => {
    expect(ayerDe('2026-11-17')).toBe('2026-11-16');
    expect(ayerDe('2026-11-01')).toBe('2026-10-31');
    expect(ayerDe('nada')).toBe('nada');
  });

  it('filasDelHilo pone un separador al empezar cada día', () => {
    const chat = (m: Partial<IResponseMensaje>): IMensajeChat => ({
      ...msg(m),
      envio: 'enviado',
    });
    const filas = filasDelHilo([
      chat({ id: 1, creado: '2026-11-16 20:00:00' }),
      chat({ id: 2, creado: '2026-11-17 08:00:00' }),
      chat({ id: 3, creado: '2026-11-17 09:00:00' }),
    ]);
    expect(filas.map(f => f.tipo)).toEqual([
      'dia',
      'mensaje',
      'dia',
      'mensaje',
      'mensaje',
    ]);
    expect(filasDelHilo([])).toEqual([]);
  });

  it('resumenReacciones cuenta y marca la mía; miReactor usa el formato de Leap', () => {
    expect(
      resumenReacciones(
        { '👍': ['student:e1', 'teacher:Meli'], '❤': [] },
        'student:e1',
      ),
    ).toEqual([{ emoji: '👍', cantidad: 2, mia: true }]);
    expect(miReactor('estudiante', 'e1', 'Ana')).toBe('student:e1');
    expect(miReactor('profe', 'p1', 'Meli')).toBe('teacher:Meli');
  });
});

describe('casos de uso', () => {
  it('obtenerHilo: sin estudiante falla; con datos los devuelve; sin mensaje de error usa el genérico', async () => {
    const repo = crearMemoriaMensajesRepository([msg({ id: 1 })]);
    expect(
      (await obtenerHiloUseCase(repo, { idEstudiante: '', despuesDe: 0 }))
        .error,
    ).toBe(true);
    const ok = await obtenerHiloUseCase(repo, {
      idEstudiante: 'e1',
      despuesDe: 0,
    });
    expect(ok.response?.mensajes).toHaveLength(1);
    jest.spyOn(repo, 'hilo').mockResolvedValue({ error: true } as never);
    const sinMsg = await obtenerHiloUseCase(repo, {
      idEstudiante: 'e1',
      despuesDe: 0,
    });
    expect(sinMsg.msg).toBeTruthy();
  });

  it('enviar: valida texto, permite media sin texto y recorta', async () => {
    const repo = crearMemoriaMensajesRepository();
    const enviar = jest.spyOn(repo, 'enviar');
    expect(
      (await enviarMensajeUseCase(repo, { idEstudiante: '', texto: 'x' }))
        .error,
    ).toBe(true);
    expect(
      (await enviarMensajeUseCase(repo, { idEstudiante: 'e1', texto: '  ' }))
        .error,
    ).toBe(true);
    const largo = await enviarMensajeUseCase(repo, {
      idEstudiante: 'e1',
      texto: 'a'.repeat(MAX_TEXTO + 1),
    });
    expect(largo.msg).toContain('muy largo');
    expect(enviar).not.toHaveBeenCalled();
    const conImagen = await enviarMensajeUseCase(repo, {
      idEstudiante: 'e1',
      texto: '',
      imagen: 'data:image/png;base64,AA==',
    });
    expect(conImagen.error).toBe(false);
    const conTexto = await enviarMensajeUseCase(repo, {
      idEstudiante: 'e1',
      texto: '  Hola  ',
    });
    expect(enviar).toHaveBeenLastCalledWith({
      idEstudiante: 'e1',
      texto: 'Hola',
    });
    expect(conTexto.response?.texto).toBe('  Hola  '.trim());
    enviar.mockResolvedValueOnce({ error: true } as never);
    expect(
      (await enviarMensajeUseCase(repo, { idEstudiante: 'e1', texto: 'x' }))
        .msg,
    ).toBeTruthy();
  });

  it('marcarLeido y reaccionar validan y delegan', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1, mio: false, leido: false }),
    ]);
    expect((await marcarLeidoUseCase(repo, '')).error).toBe(true);
    expect((await marcarLeidoUseCase(repo, 'e1')).response?.marcados).toBe(1);
    expect((await reaccionarUseCase(repo, { id: 1, emoji: 'x' })).error).toBe(
      true,
    );
    const reaccionar = jest.spyOn(repo, 'reaccionar');
    await reaccionarUseCase(repo, { id: 1, emoji: '❤️' });
    expect(reaccionar).toHaveBeenCalledWith({ id: 1, emoji: '❤' });
    reaccionar.mockResolvedValueOnce({ error: true } as never);
    expect(
      (await reaccionarUseCase(repo, { id: 1, emoji: '👍' })).msg,
    ).toBeTruthy();
  });

  it('obtenerBandeja devuelve la bandeja o el error genérico', async () => {
    const repo = crearMemoriaMensajesRepository([], { conversaciones: [] });
    expect((await obtenerBandejaUseCase(repo)).response?.noLeidos).toBe(0);
    jest.spyOn(repo, 'bandeja').mockResolvedValue({ error: true } as never);
    expect((await obtenerBandejaUseCase(repo)).msg).toBeTruthy();
  });
});

describe('repositorio en memoria', () => {
  it('reaccionar pone, cambia y quita; un mensaje que no existe da error', async () => {
    const repo = crearMemoriaMensajesRepository([msg({ id: 1 })]);
    expect((await repo.reaccionar({ id: 1, emoji: '👍' })).response).toEqual({
      '👍': ['student:memoria'],
    });
    expect((await repo.reaccionar({ id: 1, emoji: '❤' })).response).toEqual({
      '❤': ['student:memoria'],
    });
    expect((await repo.reaccionar({ id: 1, emoji: '❤' })).response).toEqual({});
    expect((await repo.reaccionar({ id: 9, emoji: '👍' })).code).toBe(404);
    const profe = crearMemoriaMensajesRepository([msg({ id: 1 })], {
      rol: 'teacher',
    });
    expect((await profe.reaccionar({ id: 1, emoji: '👍' })).response).toEqual({
      '👍': ['teacher:memoria'],
    });
  });

  it('las fallas forzadas devuelven su error', async () => {
    const f = { msg: 'Sin conexión', code: 0 };
    const repo = crearMemoriaMensajesRepository([msg({ id: 1 })], {
      falla: { hilo: f, enviar: f, marcarLeido: f, reaccionar: f, bandeja: f },
    });
    expect((await repo.hilo({ idEstudiante: 'e1', despuesDe: 0 })).msg).toBe(
      'Sin conexión',
    );
    expect((await repo.enviar({ idEstudiante: 'e1', texto: 'x' })).error).toBe(
      true,
    );
    expect((await repo.marcarLeido('e1')).error).toBe(true);
    expect((await repo.reaccionar({ id: 1, emoji: '👍' })).error).toBe(true);
    expect((await repo.bandeja()).error).toBe(true);
  });

  it('hilo devuelve solo lo nuevo con despuesDe', async () => {
    const repo = crearMemoriaMensajesRepository([
      msg({ id: 1 }),
      msg({ id: 2 }),
    ]);
    const r = await repo.hilo({ idEstudiante: 'e1', despuesDe: 1 });
    expect(r.response?.mensajes.map(m => m.id)).toEqual([2]);
  });
});

describe('adaptador de Leap', () => {
  const crudo = {
    id: '7',
    studentId: 'e1',
    remitente: 'teacher',
    nombre: 'Meli',
    texto: 'Hi',
    tieneImagen: true,
    tieneVoz: false,
    leido: true,
    editado: false,
    reacciones: { '👍': ['student:e1'] },
    creado: '2026-11-17 09:30:00',
    mio: false,
  };

  function clienteCon(
    respuesta: unknown,
    error?: { msg: string; code: number },
  ) {
    const resp = error
      ? respuestaError(error.msg, error.code)
      : respuestaOk(respuesta, 200);
    return {
      get: jest.fn().mockResolvedValue(resp),
      post: jest.fn().mockResolvedValue(resp),
    } as unknown as ClienteApi & { get: jest.Mock; post: jest.Mock };
  }

  it('mensajeDe, estadoDe y reaccionesDe tolerantes', () => {
    expect(mensajeDe(crudo)).toMatchObject({
      id: 7,
      remitente: 'teacher',
      tieneImagen: true,
      leido: true,
      mio: false,
    });
    expect(mensajeDe(null)).toBeNull();
    expect(mensajeDe({ ...crudo, id: 'x' })).toBeNull();
    expect(mensajeDe({ ...crudo, remitente: 'otro' })).toBeNull();
    expect(mensajeDe({ ...crudo, creado: '' })).toBeNull();
    expect(mensajeDe({ id: 1, creado: 'c', remitente: 'admin' })).toMatchObject(
      {
        texto: '',
        nombre: null,
        idEstudiante: '',
        reacciones: {},
      },
    );
    expect(estadoDe({ id: 3, leido: true, reacciones: [] })).toEqual({
      id: 3,
      leido: true,
      editado: false,
      reacciones: {},
    });
    expect(estadoDe({ leido: true })).toBeNull();
    expect(estadoDe('x')).toBeNull();
    expect(reaccionesDe([])).toEqual({});
    expect(reaccionesDe({ '👍': ['a', 3], '❤': [], '😂': 'x' })).toEqual({
      '👍': ['a'],
    });
  });

  it('hilo pide el sondeo incremental y mapea mensajes y estados', async () => {
    const api = clienteCon({
      mensajes: [crudo, { basura: true }],
      estados: [{ id: 7, leido: true }, 5],
    });
    const r = await crearApiMensajesRepository(api).hilo({
      idEstudiante: 'e1',
      despuesDe: 6,
    });
    expect(api.get).toHaveBeenCalledWith('api.php', {
      endpoint: 'chat',
      view: 'since',
      student_id: 'e1',
      after_id: '6',
    });
    expect(r.response?.mensajes).toHaveLength(1);
    expect(r.response?.estados).toHaveLength(1);
  });

  it('hilo: formato inválido, sin estados y error del servidor', async () => {
    const repo = (x: unknown, e?: { msg: string; code: number }) =>
      crearApiMensajesRepository(clienteCon(x, e));
    expect(
      (await repo('x').hilo({ idEstudiante: 'e1', despuesDe: 0 })).error,
    ).toBe(true);
    expect(
      (await repo({}).hilo({ idEstudiante: 'e1', despuesDe: 0 })).error,
    ).toBe(true);
    const sinEstados = await repo({ mensajes: [] }).hilo({
      idEstudiante: 'e1',
      despuesDe: 0,
    });
    expect(sinEstados.response?.estados).toEqual([]);
    const caido = await repo(null, { msg: 'No tienes acceso', code: 403 }).hilo(
      {
        idEstudiante: 'e1',
        despuesDe: 0,
      },
    );
    expect(caido).toMatchObject({
      error: true,
      msg: 'No tienes acceso',
      code: 403,
    });
  });

  it('enviar manda el cuerpo con la media y devuelve el mensaje', async () => {
    const api = clienteCon({ ok: true, mensaje: crudo });
    const r = await crearApiMensajesRepository(api).enviar({
      idEstudiante: 'e1',
      texto: 'Hi',
      imagen: 'data:image/png;base64,AA==',
      voz: 'data:audio/mp4;base64,AA==',
    });
    expect(api.post).toHaveBeenCalledWith(
      'api.php',
      {
        action: 'app_send',
        studentId: 'e1',
        message: 'Hi',
        imageData: 'data:image/png;base64,AA==',
        voiceData: 'data:audio/mp4;base64,AA==',
      },
      { endpoint: 'chat' },
    );
    expect(r.response?.id).toBe(7);
    const solo = clienteCon({ ok: true, mensaje: crudo });
    await crearApiMensajesRepository(solo).enviar({
      idEstudiante: 'e1',
      texto: 'Hi',
    });
    expect(solo.post.mock.calls[0][1]).toEqual({
      action: 'app_send',
      studentId: 'e1',
      message: 'Hi',
    });
  });

  it('enviar: respuesta sin mensaje y error del servidor', async () => {
    expect(
      (
        await crearApiMensajesRepository(clienteCon({ ok: true })).enviar({
          idEstudiante: 'e1',
          texto: 'x',
        })
      ).error,
    ).toBe(true);
    expect(
      (
        await crearApiMensajesRepository(
          clienteCon(null, { msg: 'Vacío', code: 400 }),
        ).enviar({
          idEstudiante: 'e1',
          texto: 'x',
        })
      ).msg,
    ).toBe('Vacío');
  });

  it('marcarLeido y reaccionar', async () => {
    const leido = clienteCon({ ok: true, marcados: 3 });
    expect(
      (await crearApiMensajesRepository(leido).marcarLeido('e1')).response,
    ).toEqual({
      marcados: 3,
    });
    expect(leido.post).toHaveBeenCalledWith(
      'api.php',
      { action: 'app_mark_read', studentId: 'e1' },
      { endpoint: 'chat' },
    );
    expect(
      (await crearApiMensajesRepository(clienteCon('x')).marcarLeido('e1'))
        .response,
    ).toEqual({ marcados: 0 });
    expect(
      (
        await crearApiMensajesRepository(
          clienteCon(null, { msg: 'x', code: 403 }),
        ).marcarLeido('e1')
      ).error,
    ).toBe(true);

    const reaccion = clienteCon({
      ok: true,
      reacciones: { '👍': ['student:e1'] },
    });
    expect(
      (
        await crearApiMensajesRepository(reaccion).reaccionar({
          id: 7,
          emoji: '👍',
        })
      ).response,
    ).toEqual({ '👍': ['student:e1'] });
    expect(reaccion.post).toHaveBeenCalledWith(
      'api.php',
      { action: 'app_react', id: 7, emoji: '👍' },
      { endpoint: 'chat' },
    );
    expect(
      (
        await crearApiMensajesRepository(clienteCon('x')).reaccionar({
          id: 7,
          emoji: '👍',
        })
      ).error,
    ).toBe(true);
    expect(
      (
        await crearApiMensajesRepository(
          clienteCon(null, { msg: 'x', code: 404 }),
        ).reaccionar({ id: 7, emoji: '👍' })
      ).error,
    ).toBe(true);
  });

  it('bandeja mapea las conversaciones y descarta las rotas', async () => {
    const api = clienteCon({
      noLeidos: 2,
      conversaciones: [
        { studentId: 'e1', nombre: 'Ana', noLeidos: 2, ultimo: crudo },
        { studentId: 'e2', nombre: 'Luis', noLeidos: 0, ultimo: null },
        { nombre: 'sin id' },
        'basura',
        { studentId: 'e3' },
      ],
    });
    const r = await crearApiMensajesRepository(api).bandeja();
    expect(api.get).toHaveBeenCalledWith('api.php', {
      endpoint: 'chat',
      view: 'inbox',
    });
    expect(r.response?.noLeidos).toBe(2);
    expect(r.response?.conversaciones.map(c => c.idEstudiante)).toEqual([
      'e1',
      'e2',
      'e3',
    ]);
    expect(r.response?.conversaciones[2]).toMatchObject({
      nombre: '',
      noLeidos: 0,
      ultimo: null,
    });
    expect(
      (
        await crearApiMensajesRepository(
          clienteCon({ conversaciones: [] }),
        ).bandeja()
      ).response?.noLeidos,
    ).toBe(0);
    expect(
      (await crearApiMensajesRepository(clienteCon({})).bandeja()).error,
    ).toBe(true);
    expect(
      (
        await crearApiMensajesRepository(
          clienteCon(null, { msg: 'x', code: 403 }),
        ).bandeja()
      ).error,
    ).toBe(true);
  });
});
