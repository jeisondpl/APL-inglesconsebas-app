// F1-05: adaptador del inicio con la API de Leap (CA15). Las respuestas de ejemplo son las reales
// del Docker local con `ana` (curl con el token de la App, 2026-11-17).
import {
  crearApiInicioRepository,
  franjaDe,
  mensajeDe,
  numeroDe,
  sesionDe,
  tareaDe,
  textoDe,
} from '@/modules/inicio/infrastructure/apiInicioRepository';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

const ID = 's0000000000000a1';

const ME = {
  role: 'student',
  student: {
    id: ID,
    name: 'Ana Torres',
    pkg: 'Essential',
    tokensUsed: 0,
    tokensMax: 2,
    cycle: {
      start: '2026-11-15',
      end: '2026-12-14',
      days_left: 28,
      expiring: false,
    },
  },
};

const SESION = {
  id: 12,
  student_id: ID,
  scheduled_date: '2026-11-18',
  scheduled_time: '18:00',
  status: 'scheduled',
  counts_as_taken: '0',
  cycle_start: '2026-11-15',
  cycle_end: '2026-12-14',
  new_date: null,
  new_time: null,
  teacher_name: 'Meli',
  teacher_zoom_url: 'https://us06web.zoom.us/j/00000000001',
};

const TAREA = {
  id: 1,
  title: 'Describe your morning routine',
  status: 'pending',
  due_date: '2026-11-15',
};

const MENSAJES = [
  {
    id: 1,
    sender: 'teacher',
    sender_name: 'Meli',
    message: '¡Hola Ana! Recuerda la tarea de speaking',
    image_data: null,
    voice_data: null,
    created_at: '2026-11-10 11:49:17',
  },
  {
    id: 2,
    sender: 'student',
    sender_name: 'Ana Torres',
    message: 'Listo',
    image_data: null,
    voice_data: null,
    created_at: '2026-11-10 11:49:17',
  },
];

const HORARIO = [
  {
    id: 1,
    student_id: ID,
    day_of_week: 1,
    class_time: '18:00',
    duration_minutes: 50,
  },
];

function apiFalsa(
  get: (ruta: string, params?: unknown) => HttpResponse<unknown>,
  post: (
    ruta: string,
    cuerpo?: unknown,
    params?: unknown,
  ) => HttpResponse<unknown> = () => respuestaOk(null),
) {
  const api = {
    get: jest.fn((ruta: string, params?: unknown) =>
      Promise.resolve(get(ruta, params)),
    ),
    post: jest.fn((ruta: string, cuerpo?: unknown, params?: unknown) =>
      Promise.resolve(post(ruta, cuerpo, params)),
    ),
  };
  return api as typeof api & ClienteApi;
}

describe('crearApiInicioRepository', () => {
  it('obtenerPlan llama a auth.php?action=me y mapea plan, ciclo y tokens', async () => {
    const api = apiFalsa(() => respuestaOk(ME, 200));
    const r = await crearApiInicioRepository(api).obtenerPlan();
    expect(api.get).toHaveBeenCalledWith('auth.php', { action: 'me' });
    expect(r).toEqual({
      error: false,
      code: 200,
      response: {
        plan: 'Essential',
        ciclo: { inicio: '2026-11-15', fin: '2026-12-14' },
        cancelacionesUsadas: 0,
        cancelacionesMaximas: 2,
      },
    });
  });

  it('obtenerPlan sin estudiante o sin ciclo completo', async () => {
    const sinEstudiante = apiFalsa(() => respuestaOk({ role: 'teacher' }));
    expect(
      (await crearApiInicioRepository(sinEstudiante).obtenerPlan()).msg,
    ).toBe(textosComunes.errores.respuestaInvalida);
    const vacio = apiFalsa(() => respuestaOk(null));
    expect((await crearApiInicioRepository(vacio).obtenerPlan()).error).toBe(
      true,
    );
    const sinCiclo = apiFalsa(() =>
      respuestaOk({ student: { pkg: '', tokensUsed: '1', cycle: null } }),
    );
    expect(
      (await crearApiInicioRepository(sinCiclo).obtenerPlan()).response,
    ).toEqual({
      plan: null,
      ciclo: null,
      cancelacionesUsadas: 1,
      cancelacionesMaximas: 0,
    });
  });

  it('obtenerPlan propaga el error del cliente HTTP', async () => {
    const api = apiFalsa(() => respuestaError('Sin conexión', 0));
    expect(await crearApiInicioRepository(api).obtenerPlan()).toEqual({
      error: true,
      msg: 'Sin conexión',
      code: 0,
    });
  });

  it('listarClases pide class_sessions del estudiante y mapea las filas', async () => {
    const api = apiFalsa(() => respuestaOk([SESION, null, { id: 3 }], 200));
    const r = await crearApiInicioRepository(api).listarClases({
      idEstudiante: ID,
    });
    expect(api.get).toHaveBeenCalledWith('api.php', {
      endpoint: 'class_sessions',
      student_id: ID,
    });
    expect(r.response).toEqual([
      {
        id: '12',
        fecha: '2026-11-18',
        hora: '18:00',
        estado: 'scheduled',
        cuentaComoTomada: false,
        inicioCiclo: '2026-11-15',
        finCiclo: '2026-12-14',
        fechaNueva: null,
        horaNueva: null,
        profe: 'Meli',
        enlaceZoom: 'https://us06web.zoom.us/j/00000000001',
      },
    ]);
  });

  it('listarHorario, listarTareas: rutas y mapeo', async () => {
    const api = apiFalsa((_ruta, params) =>
      (params as { endpoint: string }).endpoint === 'schedule'
        ? respuestaOk(HORARIO)
        : respuestaOk([TAREA]),
    );
    const repo = crearApiInicioRepository(api);
    expect((await repo.listarHorario({ idEstudiante: ID })).response).toEqual([
      { diaSemana: 1, hora: '18:00', duracionMin: 50 },
    ]);
    expect((await repo.listarTareas({ idEstudiante: ID })).response).toEqual([
      {
        id: '1',
        titulo: 'Describe your morning routine',
        estado: 'pending',
        venceEl: '2026-11-15',
      },
    ]);
    expect(api.get).toHaveBeenCalledWith('api.php', {
      endpoint: 'tasks',
      student_id: ID,
    });
  });

  it('una lista que no es un array es un error de formato', async () => {
    const api = apiFalsa(() => respuestaOk({ error: 'raro' }, 200));
    expect(
      await crearApiInicioRepository(api).listarTareas({ idEstudiante: ID }),
    ).toEqual({
      error: true,
      msg: textosComunes.errores.respuestaInvalida,
      code: 200,
    });
  });

  it('una lista con error HTTP lo propaga (403 de la puerta)', async () => {
    const api = apiFalsa(() =>
      respuestaError('No tienes acceso a estos datos.', 403),
    );
    expect(
      await crearApiInicioRepository(api).listarClases({ idEstudiante: ID }),
    ).toEqual({
      error: true,
      msg: 'No tienes acceso a estos datos.',
      code: 403,
    });
    const sinMsg = apiFalsa(() => ({ error: true, code: 500 }));
    expect(
      (
        await crearApiInicioRepository(sinMsg).listarHorario({
          idEstudiante: ID,
        })
      ).msg,
    ).toBe(textosComunes.errores.desconocido);
  });

  it('contarNoLeidos y listarMensajes usan chispa con el studentId', async () => {
    const api = apiFalsa(
      () => respuestaOk(null),
      (_ruta, cuerpo) =>
        (cuerpo as { action: string }).action === 'get_unread'
          ? respuestaOk({ unread: '2' })
          : respuestaOk(MENSAJES),
    );
    const repo = crearApiInicioRepository(api);
    expect((await repo.contarNoLeidos({ idEstudiante: ID })).response).toBe(2);
    expect(api.post).toHaveBeenCalledWith(
      'api.php',
      { action: 'get_unread', studentId: ID },
      { endpoint: 'chispa' },
    );
    const mensajes = await repo.listarMensajes({ idEstudiante: ID });
    expect(api.post).toHaveBeenCalledWith(
      'api.php',
      { action: 'get_thread', studentId: ID },
      { endpoint: 'chispa' },
    );
    expect(mensajes.response?.map(m => [m.remitente, m.deEstudiante])).toEqual([
      ['Meli', false],
      ['Ana Torres', true],
    ]);
  });

  it('contarNoLeidos: negativo a 0, sin número es error y propaga fallos', async () => {
    const negativo = apiFalsa(
      () => respuestaOk(null),
      () => respuestaOk({ unread: -3 }),
    );
    expect(
      (
        await crearApiInicioRepository(negativo).contarNoLeidos({
          idEstudiante: ID,
        })
      ).response,
    ).toBe(0);
    const raro = apiFalsa(
      () => respuestaOk(null),
      () => respuestaOk({}),
    );
    expect(
      (
        await crearApiInicioRepository(raro).contarNoLeidos({
          idEstudiante: ID,
        })
      ).error,
    ).toBe(true);
    const caido = apiFalsa(
      () => respuestaOk(null),
      () => respuestaError('caído', 500),
    );
    expect(
      (
        await crearApiInicioRepository(caido).contarNoLeidos({
          idEstudiante: ID,
        })
      ).msg,
    ).toBe('caído');
  });
});

describe('mapeos', () => {
  it('numeroDe y textoDe', () => {
    expect(numeroDe('3')).toBe(3);
    expect(numeroDe(4)).toBe(4);
    expect(numeroDe('x')).toBe(0);
    expect(numeroDe(null, 7)).toBe(7);
    expect(textoDe('  hola ')).toBe('hola');
    expect(textoDe('   ')).toBeNull();
    expect(textoDe(3)).toBeNull();
  });

  it('sesionDe exige id y fecha; counts_as_taken numérico o texto', () => {
    expect(sesionDe({ id: null, scheduled_date: '2026-11-18' })).toBeNull();
    expect(sesionDe({ id: 1 })).toBeNull();
    expect(
      sesionDe({ id: 1, scheduled_date: '2026-11-18', counts_as_taken: 1 }),
    ).toMatchObject({ cuentaComoTomada: true, hora: '', estado: '' });
  });

  it('franjaDe exige día y hora; duración 0 o inválida es null', () => {
    expect(franjaDe({ day_of_week: 'x', class_time: '18:00' })).toBeNull();
    expect(franjaDe({ day_of_week: 2, class_time: null })).toBeNull();
    expect(
      franjaDe({ day_of_week: '2', class_time: '18:00', duration_minutes: 0 }),
    ).toEqual({ diaSemana: 2, hora: '18:00', duracionMin: null });
  });

  it('tareaDe y mensajeDe: sin id no hay fila; adjuntos', () => {
    expect(tareaDe({ id: undefined as unknown as number })).toBeNull();
    expect(tareaDe({ id: 9 })).toEqual({
      id: '9',
      titulo: '',
      estado: '',
      venceEl: null,
    });
    expect(mensajeDe({ id: null })).toBeNull();
    expect(mensajeDe({ id: 1, image_data: 'data:…' })).toMatchObject({
      adjunto: 'imagen',
      texto: '',
      remitente: '',
      enviadoEl: '',
    });
    expect(mensajeDe({ id: 1, voice_data: 'data:…' })?.adjunto).toBe('voz');
  });
});

describe('crearMemoriaInicioRepository', () => {
  it('por defecto está vacío (nada de datos de ejemplo)', async () => {
    const repo = crearMemoriaInicioRepository();
    const args = { idEstudiante: ID };
    expect((await repo.obtenerPlan()).response).toEqual({
      plan: null,
      ciclo: null,
      cancelacionesUsadas: 0,
      cancelacionesMaximas: 0,
    });
    expect((await repo.listarClases(args)).response).toEqual([]);
    expect((await repo.listarHorario(args)).response).toEqual([]);
    expect((await repo.listarTareas(args)).response).toEqual([]);
    expect((await repo.contarNoLeidos(args)).response).toBe(0);
    expect((await repo.listarMensajes(args)).response).toEqual([]);
  });

  it('devuelve los datos que se le pasan', async () => {
    const repo = crearMemoriaInicioRepository({ noLeidos: 4 });
    expect((await repo.contarNoLeidos({ idEstudiante: ID })).response).toBe(4);
  });
});
