// F2-02: reglas de dominio de la agenda del profe, casos de uso y mapeo de la API de Leap.
import type { ClienteApi } from '@/shared/lib/api';
import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import { mensajesAgenda } from '@/modules/agenda/domain/agenda.mensajes';
import {
  marcarClaseUseCase,
  obtenerAgendaUseCase,
} from '@/modules/agenda/aplications/obtenerAgenda/obtenerAgenda';
import type {
  IClaseAgenda,
  IResponseClaseAgenda,
} from '@/modules/agenda/domain/entities/Agenda.entities';
import {
  clasesDelDia,
  clasesDelProfe,
  momentoClase,
  puedeMarcar,
  resumenSemana,
  semanaDe,
  sinMarcarAnteriores,
  sumarDias,
} from '@/modules/agenda/domain/validations/agenda.validations';
import {
  claseAgendaDe,
  crearApiAgendaRepository,
  estudianteAgendaDe,
} from '@/modules/agenda/infrastructure/apiAgendaRepository';
import { crearMemoriaAgendaRepository } from '@/modules/agenda/infrastructure/memoriaAgendaRepository';

// mar 17 nov 2026, 10:00 en Bogotá.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);

const clase = (c: Partial<IResponseClaseAgenda>): IResponseClaseAgenda => ({
  id: 'c1',
  idEstudiante: 'e1',
  fecha: '2026-11-17',
  hora: '09:00',
  idProfe: 'p1',
  estado: 'scheduled',
  numeroClase: 3,
  enlaceZoom: null,
  ...c,
});

describe('momentoClase', () => {
  const inicio = Date.UTC(2026, 10, 17, 15, 0);
  it('marcadas', () => {
    expect(momentoClase('taken', inicio, AHORA)).toBe('tomada');
    expect(momentoClase('rescheduled_taken', inicio, AHORA)).toBe('tomada');
    expect(momentoClase('no_show', inicio, AHORA)).toBe('no_asistio');
    expect(momentoClase('rescheduled_no_show', inicio, AHORA)).toBe(
      'no_asistio',
    );
  });
  it('programada: próxima, en curso (50 min) y por marcar', () => {
    expect(momentoClase('scheduled', inicio + 1, inicio)).toBe('proxima');
    expect(momentoClase('scheduled', inicio, inicio)).toBe('en_curso');
    expect(momentoClase('scheduled', inicio, inicio + 49 * 60000)).toBe(
      'en_curso',
    );
    expect(momentoClase('scheduled', inicio, inicio + 50 * 60000)).toBe(
      'por_marcar',
    );
  });
});

describe('clasesDelProfe', () => {
  const estudiantes = [{ id: 'e1', nombre: 'Ana' }];
  it('solo las del profe, con estados de agenda, por hora y con nombre', () => {
    const r = clasesDelProfe(
      [
        clase({ id: 'a', hora: '15:00' }),
        clase({ id: 'b', hora: '08:00' }),
        clase({ id: 'otro', idProfe: 'p2' }),
        clase({ id: 'cancelada', estado: 'cancelled_no_impact' }),
        clase({ id: 'sin-fecha-valida', fecha: 'xx' }),
      ],
      estudiantes,
      'p1',
      AHORA,
      'Estudiante',
    );
    expect(r.map(c => c.id)).toEqual(['b', 'a']);
    expect(r[0].estudiante).toBe('Ana');
  });
  it('un estudiante que no está en la lista usa el nombre genérico', () => {
    const r = clasesDelProfe(
      [clase({ idEstudiante: 'zz' })],
      estudiantes,
      'p1',
      AHORA,
      'Estudiante',
    );
    expect(r[0].estudiante).toBe('Estudiante');
  });
});

describe('fechas de la semana', () => {
  it('sumarDias cruza mes y año; fecha inválida se devuelve tal cual', () => {
    expect(sumarDias('2026-11-30', 1)).toBe('2026-12-01');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('xx', 3)).toBe('xx');
  });
  it('semanaDe: lunes a domingo (también si el día es domingo)', () => {
    expect(semanaDe('2026-11-17')[0]).toBe('2026-11-16');
    expect(semanaDe('2026-11-17')[6]).toBe('2026-11-22');
    expect(semanaDe('2026-11-22')[0]).toBe('2026-11-16');
    expect(semanaDe('2026-11-16')).toHaveLength(7);
    expect(semanaDe('xx')).toEqual([]);
  });
});

describe('día, semana y sin marcar', () => {
  const todas: IClaseAgenda[] = clasesDelProfe(
    [
      clase({ id: 'hoy-1', hora: '08:00' }), // 8:00 → ya pasó (>50 min): por marcar
      clase({ id: 'hoy-2', hora: '18:00' }), // próxima
      clase({ id: 'hoy-3', hora: '07:00', estado: 'taken' }),
      clase({ id: 'ayer', fecha: '2026-11-16', hora: '10:00' }), // por marcar
      clase({ id: 'viejo', fecha: '2026-10-01', hora: '10:00' }), // fuera de 30 días
      clase({ id: 'mañana', fecha: '2026-11-18', hora: '10:00' }),
    ],
    [],
    'p1',
    AHORA,
    'Estudiante',
  );

  it('clasesDelDia', () => {
    expect(clasesDelDia(todas, '2026-11-17').map(c => c.id)).toEqual([
      'hoy-3',
      'hoy-1',
      'hoy-2',
    ]);
  });

  it('resumenSemana: total, sin marcar y cuál es hoy', () => {
    const s = resumenSemana(todas, '2026-11-17', AHORA);
    expect(s).toHaveLength(7);
    const hoy = s.find(d => d.fecha === '2026-11-17');
    expect(hoy).toMatchObject({ esHoy: true, total: 3, sinMarcar: 1 });
    expect(s.find(d => d.fecha === '2026-11-16')).toMatchObject({
      esHoy: false,
      total: 1,
      sinMarcar: 1,
    });
    expect(s.find(d => d.fecha === '2026-11-19')?.total).toBe(0);
  });

  it('sinMarcarAnteriores: solo días anteriores, hasta 30 días, lo más reciente primero', () => {
    expect(sinMarcarAnteriores(todas, AHORA).map(c => c.id)).toEqual(['ayer']);
  });

  it('puedeMarcar: programada y ya empezada', () => {
    const [tomada] = todas.filter(c => c.id === 'hoy-3');
    const [pasada] = todas.filter(c => c.id === 'hoy-1');
    const [proxima] = todas.filter(c => c.id === 'hoy-2');
    expect(puedeMarcar(pasada, AHORA)).toBe(true);
    expect(puedeMarcar(proxima, AHORA)).toBe(false);
    expect(puedeMarcar(tomada, AHORA)).toBe(false);
  });
});

describe('casos de uso', () => {
  it('obtenerAgenda: sin idProfe es error', async () => {
    const r = await obtenerAgendaUseCase(crearMemoriaAgendaRepository(), {
      idProfe: '',
    });
    expect(r.error).toBe(true);
  });

  it('obtenerAgenda: sin clases es error; sin estudiantes no', async () => {
    const base = crearMemoriaAgendaRepository([clase({})]);
    const sinClases = await obtenerAgendaUseCase(
      { ...base, listarClases: async () => respuestaError('x', 500) },
      { idProfe: 'p1' },
    );
    expect(sinClases.error).toBe(true);
    const sinNombres = await obtenerAgendaUseCase(
      { ...base, listarEstudiantes: async () => respuestaError('x', 500) },
      { idProfe: 'p1' },
    );
    expect(sinNombres.error).toBe(false);
    expect(sinNombres.response?.estudiantes).toEqual([]);
  });

  it('obtenerAgenda: error de clases sin mensaje usa el genérico', async () => {
    const base = crearMemoriaAgendaRepository();
    const r = await obtenerAgendaUseCase(
      {
        ...base,
        listarClases: async () => ({ error: true, response: null } as never),
      },
      { idProfe: 'p1' },
    );
    expect(r.error).toBe(true);
    expect(r.msg).toBeTruthy();
  });

  it('marcarClase: una marca inválida no llama a Leap', async () => {
    const repo = crearMemoriaAgendaRepository();
    const espia = jest.spyOn(repo, 'marcarClase');
    const r = await marcarClaseUseCase(repo, {
      idClase: 'c1',
      marca: 'cancelled' as never,
    });
    expect(r.error).toBe(true);
    expect(r.msg).toBe(mensajesAgenda.marcaInvalida);
    expect(espia).not.toHaveBeenCalled();
  });

  it('marcarClase: pasa y un error sin mensaje se vuelve el genérico', async () => {
    const repo = crearMemoriaAgendaRepository();
    expect(
      (await marcarClaseUseCase(repo, { idClase: 'c1', marca: 'taken' })).error,
    ).toBe(false);
    const sinMsg = {
      ...repo,
      marcarClase: async () => ({ error: true, response: null, code: 500 }),
    } as never;
    const r = await marcarClaseUseCase(sinMsg, {
      idClase: 'c1',
      marca: 'no_show',
    });
    expect(r.error).toBe(true);
    expect(r.msg).toBeTruthy();
  });
});

describe('mapeo de Leap', () => {
  it('claseAgendaDe: la reprogramación manda y los números llegan como texto', () => {
    expect(
      claseAgendaDe({
        id: 5,
        student_id: 'e1',
        scheduled_date: '2026-11-17',
        scheduled_time: '09:00',
        new_date: '2026-11-18',
        new_time: '10:00',
        teacher_id: 'p1',
        new_teacher_id: 'p2',
        status: 'rescheduled',
        class_number: '4',
        teacher_zoom_url: ' https://zoom ',
      }),
    ).toEqual({
      id: '5',
      idEstudiante: 'e1',
      fecha: '2026-11-18',
      hora: '10:00',
      idProfe: 'p2',
      estado: 'rescheduled',
      numeroClase: 4,
      enlaceZoom: 'https://zoom',
    });
  });

  it('claseAgendaDe: sin id, fecha o profe se descarta; campos vacíos toman su valor', () => {
    expect(claseAgendaDe({ scheduled_date: '2026-11-17' })).toBeNull();
    expect(claseAgendaDe({ id: 1, teacher_id: 'p1' })).toBeNull();
    expect(claseAgendaDe({ id: 1, scheduled_date: '2026-11-17' })).toBeNull();
    expect(
      claseAgendaDe({ id: 1, scheduled_date: '2026-11-17', teacher_id: 'p1' }),
    ).toMatchObject({
      idEstudiante: '',
      hora: '',
      estado: '',
      numeroClase: null,
    });
  });

  it('estudianteAgendaDe', () => {
    expect(estudianteAgendaDe({ id: 'e1', name: 'Ana' })).toEqual({
      id: 'e1',
      nombre: 'Ana',
    });
    expect(estudianteAgendaDe({ id: 'e2' })).toEqual({ id: 'e2', nombre: '' });
    expect(estudianteAgendaDe({})).toBeNull();
  });
});

describe('apiAgendaRepository', () => {
  const api = (
    get: unknown,
    post: unknown = respuestaOk({ ok: true, finalStatus: 'taken' }),
  ) =>
    ({
      get: jest.fn(async () => get),
      post: jest.fn(async () => post),
    } as unknown as ClienteApi);

  it('listarClases: mapea y pide todo lo del profe', async () => {
    const cliente = api(
      respuestaOk([
        { id: 1, scheduled_date: '2026-11-17', teacher_id: 'p1' },
        { id: 2 },
        'basura',
      ]),
    );
    const r = await crearApiAgendaRepository(cliente).listarClases();
    expect(r.response).toHaveLength(1);
    expect(cliente.get).toHaveBeenCalledWith('api.php', {
      endpoint: 'class_sessions',
      all_teacher: '1',
    });
  });

  it('listarClases / listarEstudiantes: error del cliente y formato inválido', async () => {
    const mal = crearApiAgendaRepository(api(respuestaError('Sin red', 0)));
    expect((await mal.listarClases()).msg).toBe('Sin red');
    const sinMsg = crearApiAgendaRepository(
      api({ error: true, response: null }),
    );
    expect((await sinMsg.listarEstudiantes()).error).toBe(true);
    const noLista = crearApiAgendaRepository(api(respuestaOk({} as never)));
    expect((await noLista.listarClases()).error).toBe(true);
  });

  it('listarEstudiantes: mapea', async () => {
    const r = await crearApiAgendaRepository(
      api(respuestaOk([{ id: 'e1', name: 'Ana' }])),
    ).listarEstudiantes();
    expect(r.response).toEqual([{ id: 'e1', nombre: 'Ana' }]);
  });

  it('marcarClase: manda update_status y devuelve el estado final', async () => {
    const cliente = api(respuestaOk([]));
    const r = await crearApiAgendaRepository(cliente).marcarClase({
      idClase: 'c1',
      marca: 'taken',
    });
    expect(r.response).toEqual({ estadoFinal: 'taken' });
    expect(cliente.post).toHaveBeenCalledWith(
      'api.php',
      { action: 'update_status', id: 'c1', status: 'taken' },
      { endpoint: 'class_sessions' },
    );
  });

  it('marcarClase: error de Leap (con y sin mensaje) y respuesta sin estado', async () => {
    const args = { idClase: 'c1', marca: 'no_show' } as const;
    const rechazo = crearApiAgendaRepository(
      api(
        respuestaOk([]),
        respuestaError('Esta clase todavía no empieza.', 403),
      ),
    );
    expect((await rechazo.marcarClase(args)).msg).toBe(
      'Esta clase todavía no empieza.',
    );
    const sinMsg = crearApiAgendaRepository(
      api(respuestaOk([]), { error: true, response: null } as never),
    );
    expect((await sinMsg.marcarClase(args)).error).toBe(true);
    const sinEstado = crearApiAgendaRepository(
      api(respuestaOk([]), respuestaOk({ ok: true })),
    );
    expect((await sinEstado.marcarClase(args)).error).toBe(true);
  });

  it('memoria: el error forzado de marcar', async () => {
    const repo = crearMemoriaAgendaRepository([], {
      marcarError: { msg: 'ya marcada', code: 403 },
    });
    expect(
      (await repo.marcarClase({ idClase: 'c1', marca: 'taken' })).msg,
    ).toBe('ya marcada');
  });
});
