// F3-02: reglas de dominio, casos de uso y adaptador API de las tareas.
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import {
  entregarTareaUseCase,
  marcarFeedbackVistoUseCase,
  obtenerMediaTareaUseCase,
  obtenerTareasUseCase,
  revisarTareaUseCase,
} from '@/modules/tareas/aplications/tareas/tareas';
import {
  duracionDeVoz,
  estaVencida,
  MAX_COMENTARIO,
  MAX_NOTA,
  MAX_TEXTO_ENTREGA,
  MAX_VOZ,
  ordenarSeccion,
  seccionDe,
  tareasDeSeccion,
} from '@/modules/tareas/domain/validations/tareas.validations';
import {
  crearApiTareasRepository,
  tareaDe,
} from '@/modules/tareas/infrastructure/apiTareasRepository';
import {
  crearMemoriaTareasRepository,
  tareaDePrueba as tarea,
} from '@/modules/tareas/infrastructure/memoriaTareasRepository';

describe('reglas', () => {
  it('seccionDe según el estado', () => {
    expect(seccionDe(tarea())).toBe('pendientes');
    expect(seccionDe(tarea({ estado: 'ready_review' }))).toBe('porRevisar');
    expect(seccionDe(tarea({ estado: 'reviewed' }))).toBe('revisadas');
  });

  it('pendientes: lo que vence antes primero y sin fecha al final; lo demás, lo más reciente', () => {
    const a = tarea({ id: 1, vence: '2026-12-01' });
    const b = tarea({ id: 2, vence: '2026-11-20' });
    const c = tarea({ id: 3, vence: null });
    const d = tarea({ id: 4, vence: '2026-11-20' });
    expect(ordenarSeccion([a, c, d, b], 'pendientes').map(t => t.id)).toEqual([
      2, 4, 1, 3,
    ]);
    expect(ordenarSeccion([a, b, c], 'revisadas').map(t => t.id)).toEqual([
      3, 2, 1,
    ]);
    expect(
      tareasDeSeccion(
        [a, tarea({ id: 9, estado: 'reviewed' })],
        'pendientes',
      ).map(t => t.id),
    ).toEqual([1]);
  });

  it('estaVencida: solo pendientes cuya fecha ya pasó (hora de Bogotá)', () => {
    const ahora = Date.UTC(2026, 10, 23, 12, 0);
    expect(estaVencida(tarea({ vence: '2026-11-22' }), ahora)).toBe(true);
    expect(estaVencida(tarea({ vence: '2026-11-23' }), ahora)).toBe(false);
    expect(estaVencida(tarea({ vence: null }), ahora)).toBe(false);
    expect(
      estaVencida(tarea({ vence: '2026-11-01', estado: 'reviewed' }), ahora),
    ).toBe(false);
  });

  it('duracionDeVoz', () => {
    expect(duracionDeVoz(7000)).toBe('0:07');
    expect(duracionDeVoz(65000)).toBe('1:05');
  });
});

describe('casos de uso', () => {
  it('entregar valida id, respuesta vacía, largo y peso del audio', async () => {
    const repo = crearMemoriaTareasRepository({ tareas: [tarea()] });
    expect(
      (await entregarTareaUseCase(repo, { id: 0, texto: 'x' })).error,
    ).toBe(true);
    expect(
      (await entregarTareaUseCase(repo, { id: 1, texto: '  ' })).msg,
    ).toMatch(/respuesta o graba/);
    expect(
      (
        await entregarTareaUseCase(repo, {
          id: 1,
          texto: 'x'.repeat(MAX_TEXTO_ENTREGA + 1),
        })
      ).msg,
    ).toMatch(/muy larga/);
    expect(
      (
        await entregarTareaUseCase(repo, {
          id: 1,
          texto: '',
          voz: 'x'.repeat(MAX_VOZ + 1),
        })
      ).msg,
    ).toMatch(/audio/);
    expect(repo.entregas).toEqual([]);
  });

  it('entregar con texto o solo audio llega al repositorio, con el texto limpio', async () => {
    const repo = crearMemoriaTareasRepository({ tareas: [tarea()] });
    await entregarTareaUseCase(repo, { id: 1, texto: '  Hola  ' });
    await entregarTareaUseCase(repo, {
      id: 1,
      texto: '',
      voz: 'data:audio/mp4;base64,QQ==',
    });
    expect(repo.entregas).toEqual([
      { id: 1, texto: 'Hola', voz: undefined },
      { id: 1, texto: '', voz: 'data:audio/mp4;base64,QQ==' },
    ]);
  });

  it('revisar exige algo de feedback y respeta los topes', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [tarea({ estado: 'ready_review' })],
    });
    const rev = (x: Partial<Parameters<typeof revisarTareaUseCase>[1]>) =>
      revisarTareaUseCase(repo, { id: 1, comentario: '', nota: '', ...x });
    expect((await rev({ id: 0 })).error).toBe(true);
    expect((await rev({})).msg).toMatch(/comentario, una nota/);
    expect(
      (await rev({ comentario: 'x'.repeat(MAX_COMENTARIO + 1) })).msg,
    ).toMatch(/comentario es muy largo/);
    expect((await rev({ nota: 'x'.repeat(MAX_NOTA + 1) })).msg).toMatch(
      /nota es muy larga/,
    );
    expect((await rev({ voz: 'x'.repeat(MAX_VOZ + 1) })).msg).toMatch(/audio/);
    expect((await rev({ comentario: ' Bien ', nota: '9' })).error).toBe(false);
    expect(repo.revisiones).toEqual([
      { id: 1, comentario: 'Bien', nota: '9', voz: undefined },
    ]);
  });

  it('media, lista y feedback visto: validan el id y dejan pasar el error del servidor', async () => {
    const repo = crearMemoriaTareasRepository({
      tareas: [tarea({ estado: 'reviewed' })],
      falla: { media: { msg: 'sin red' } },
    });
    expect((await obtenerMediaTareaUseCase(repo, 0, 'entrega')).error).toBe(
      true,
    );
    expect((await obtenerMediaTareaUseCase(repo, 1, 'entrega')).msg).toBe(
      'sin red',
    );
    expect((await obtenerTareasUseCase(repo)).response?.feedbackNuevo).toBe(1);
    expect((await marcarFeedbackVistoUseCase(repo, 0)).error).toBe(true);
    await marcarFeedbackVistoUseCase(repo, 1);
    expect(repo.vistos).toEqual([1]);
    expect((await obtenerTareasUseCase(repo)).response?.feedbackNuevo).toBe(0);
  });

  it('un error sin mensaje se vuelve el genérico', async () => {
    const repo = crearMemoriaTareasRepository({
      falla: { listar: { msg: '' } },
    });
    expect((await obtenerTareasUseCase(repo)).msg).toMatch(/inesperado/);
  });
});

describe('apiTareasRepository', () => {
  const crudo = {
    id: '4',
    idEstudiante: 's1',
    estudiante: 'Ana',
    titulo: 'T',
    instruccion: 'I',
    estado: 'ready_review',
    vence: '2026-11-22',
    personalizada: true,
    tieneVozEntrega: true,
    imagenesEntrega: '2',
  };

  it('tareaDe mapea y rechaza lo incompleto', () => {
    expect(tareaDe(crudo)).toMatchObject({
      id: 4,
      estado: 'ready_review',
      tieneVozEntrega: true,
      imagenesEntrega: 2,
      entrega: null,
      archivos: 0,
    });
    expect(tareaDe({ ...crudo, estado: 'raro' })).toBeNull();
    expect(tareaDe({ ...crudo, id: 0 })).toBeNull();
    expect(tareaDe({ ...crudo, titulo: undefined })).toBeNull();
    expect(tareaDe('x')).toBeNull();
    expect(tareaDe([])).toBeNull();
  });

  const api = (get: jest.Mock, post: jest.Mock = jest.fn()) =>
    crearApiTareasRepository({ get, post } as unknown as ClienteApi);

  it('listar: pide view=list, descarta tareas inválidas y lee los contadores', async () => {
    const get = jest.fn().mockResolvedValue(
      respuestaOk({
        tareas: [crudo, { basura: true }],
        pendientes: 1,
        porRevisar: '2',
        feedbackNuevo: 0,
      }),
    );
    const r = await api(get).listar();
    expect(get).toHaveBeenCalledWith('api.php', {
      endpoint: 'tareas',
      view: 'list',
    });
    expect(r.response?.tareas).toHaveLength(1);
    expect(r.response).toMatchObject({ pendientes: 1, porRevisar: 2 });
  });

  it('listar: error del servidor y formato inválido', async () => {
    expect(
      (
        await api(
          jest.fn().mockResolvedValue(respuestaError('caído', 500)),
        ).listar()
      ).msg,
    ).toBe('caído');
    expect(
      (await api(jest.fn().mockResolvedValue(respuestaOk({ x: 1 }))).listar())
        .msg,
    ).toMatch(/formato/);
    expect(
      (
        await api(
          jest.fn().mockResolvedValue(respuestaError(undefined as never)),
        ).listar()
      ).error,
    ).toBe(true);
  });

  it('media: voz e imágenes, o error', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(respuestaOk({ voz: 'v', imagenes: ['a', 3, 'b'] }))
      .mockResolvedValueOnce(respuestaOk({ voz: null }))
      .mockResolvedValueOnce(respuestaOk('x'))
      .mockResolvedValueOnce(respuestaError('no', 404));
    const repo = api(get);
    expect((await repo.media(1, 'entrega')).response).toEqual({
      voz: 'v',
      imagenes: ['a', 'b'],
    });
    expect(get).toHaveBeenCalledWith('api.php', {
      endpoint: 'tareas',
      view: 'media',
      id: 1,
      slot: 'entrega',
    });
    expect((await repo.media(1, 'feedback')).response).toEqual({
      voz: null,
      imagenes: [],
    });
    expect((await repo.media(1, 'feedback')).error).toBe(true);
    expect((await repo.media(1, 'feedback')).msg).toBe('no');
  });

  it('entregar, revisar y feedback visto mandan su acción', async () => {
    const post = jest.fn().mockResolvedValue(respuestaOk({ ok: true }));
    const repo = api(jest.fn(), post);
    await repo.entregar({ id: 1, texto: 'hola', voz: 'v' });
    await repo.entregar({ id: 1, texto: 'hola' });
    await repo.revisar({ id: 1, comentario: 'c', nota: '9', voz: 'v' });
    await repo.marcarFeedbackVisto(1);
    expect(post.mock.calls.map(c => c[1])).toEqual([
      { action: 'app_submit', id: 1, text: 'hola', voiceData: 'v' },
      { action: 'app_submit', id: 1, text: 'hola' },
      { action: 'app_review', id: 1, comment: 'c', grade: '9', voiceData: 'v' },
      { action: 'app_feedback_seen', id: 1 },
    ]);
    expect(post.mock.calls[0][2]).toEqual({ endpoint: 'tareas' });
  });

  it('un error al enviar vuelve con el mensaje del servidor', async () => {
    const post = jest
      .fn()
      .mockResolvedValue(respuestaError('Ya fue revisada', 409));
    expect(
      await api(jest.fn(), post).entregar({ id: 1, texto: 'x' }),
    ).toMatchObject({ error: true, msg: 'Ya fue revisada', code: 409 });
  });
});
