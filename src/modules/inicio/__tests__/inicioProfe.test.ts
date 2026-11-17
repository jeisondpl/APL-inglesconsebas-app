// F1-07: inicio del profe. Dominio (clases de hoy y su momento), caso de uso, vista y adaptador de
// Leap con un fetch falso.
import { obtenerResumenInicioProfeUseCase } from '@/modules/inicio/aplications/obtenerResumenInicioProfe/obtenerResumenInicioProfe';
import { construirVistaInicioProfe } from '@/modules/inicio/aplications/vistaInicioProfe/vistaInicioProfe';
import type { IResponseClaseProfe } from '@/modules/inicio/domain/entities/InicioProfe.entities';
import type { InicioProfeRepository } from '@/modules/inicio/domain/models/InicioProfeRepository';
import {
  claseDestacada,
  clasesDeHoy,
  DURACION_CLASE_MIN,
  momentoClase,
  tareasPorRevisar,
} from '@/modules/inicio/domain/validations/inicioProfe.validations';
import {
  asistenciaDe,
  claseProfeDe,
  crearApiInicioProfeRepository,
  estudianteDe,
  tareaRevisionDe,
} from '@/modules/inicio/infrastructure/apiInicioProfeRepository';
import { crearMemoriaInicioProfeRepository } from '@/modules/inicio/infrastructure/memoriaInicioProfeRepository';
import { crearClienteApi } from '@/shared/lib/api';
import { respuestaError } from '@/shared/lib/HttpResponse';

// 17 nov 2026, 10:00 en Bogotá (UTC-5) = 15:00 UTC.
const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const MIN = 60 * 1000;
const PROFE = 't1';

const clase = (
  cambios: Partial<IResponseClaseProfe> = {},
): IResponseClaseProfe => ({
  id: '1',
  idEstudiante: 's1',
  fecha: '2026-11-17',
  hora: '11:00',
  idProfe: PROFE,
  estado: 'scheduled',
  numeroClase: 3,
  enlaceZoom: 'https://zoom.us/j/1',
  ...cambios,
});

const ESTUDIANTES = [
  { id: 's1', nombre: 'Ana Torres' },
  { id: 's2', nombre: 'Luis Pérez' },
];

describe('momentoClase', () => {
  const inicio = AHORA;
  it.each([
    ['taken', inicio, 'tomada'],
    ['rescheduled_taken', inicio, 'tomada'],
    ['no_show', inicio, 'no_asistio'],
    ['rescheduled_no_show', inicio, 'no_asistio'],
  ])('%s → %s sin mirar la hora', (estado, ini, esperado) => {
    expect(momentoClase(estado, ini, AHORA)).toBe(esperado);
  });

  it('programada: próxima antes, en curso los 50 min y sin marcar después', () => {
    expect(momentoClase('scheduled', AHORA + MIN, AHORA)).toBe('proxima');
    expect(momentoClase('scheduled', AHORA, AHORA)).toBe('en_curso');
    expect(
      momentoClase('scheduled', AHORA - (DURACION_CLASE_MIN - 1) * MIN, AHORA),
    ).toBe('en_curso');
    expect(
      momentoClase('scheduled', AHORA - DURACION_CLASE_MIN * MIN, AHORA),
    ).toBe('por_marcar');
  });
});

describe('clasesDeHoy', () => {
  it('solo las del profe, de hoy en Bogotá y de estados del día; ordenadas por hora y con nombre', () => {
    const r = clasesDeHoy(
      [
        clase({ id: 'tarde', hora: '15:00', idEstudiante: 's2' }),
        clase({ id: 'ya', hora: '08:00', estado: 'taken' }),
        clase({ id: 'otro-profe', idProfe: 't2' }),
        clase({ id: 'ayer', fecha: '2026-11-16' }),
        clase({ id: 'cancelada', estado: 'cancelled_late' }),
        clase({ id: 'sin-hora', hora: 'xx' }),
        clase({ id: 'desconocido', hora: '12:00', idEstudiante: 's9' }),
      ],
      ESTUDIANTES,
      PROFE,
      AHORA,
      'Estudiante',
    );
    expect(r.map(c => c.id)).toEqual(['ya', 'desconocido', 'tarde']);
    expect(r[0]).toMatchObject({ estudiante: 'Ana Torres', momento: 'tomada' });
    expect(r[1].estudiante).toBe('Estudiante');
    expect(r[2]).toMatchObject({
      estudiante: 'Luis Pérez',
      momento: 'proxima',
    });
  });

  it('a las 23:30 de Bogotá sigue siendo el mismo día (no el siguiente en UTC)', () => {
    const noche = Date.UTC(2026, 10, 18, 4, 30); // 17 nov 23:30 en Bogotá
    const r = clasesDeHoy(
      [clase({ hora: '23:00' })],
      ESTUDIANTES,
      PROFE,
      noche,
      'Estudiante',
    );
    expect(r).toHaveLength(1);
    expect(r[0].momento).toBe('en_curso');
  });
});

describe('claseDestacada y tareasPorRevisar', () => {
  const base = clasesDeHoy(
    [
      clase({ id: 'a', hora: '08:00' }),
      clase({ id: 'b', hora: '09:30' }),
      clase({ id: 'c', hora: '12:00' }),
    ],
    ESTUDIANTES,
    PROFE,
    AHORA,
    '',
  );

  it('prefiere la clase en curso, si no la próxima, si no ninguna', () => {
    expect(claseDestacada(base)?.id).toBe('b');
    expect(claseDestacada(base.filter(c => c.id !== 'b'))?.id).toBe('c');
    expect(claseDestacada(base.filter(c => c.id === 'a'))).toBeNull();
  });

  it('cuenta las ready_review y muestra 3', () => {
    const tareas = [
      'ready_review',
      'pending',
      'ready_review',
      'ready_review',
      'ready_review',
    ].map((estado, i) => ({
      id: String(i),
      titulo: 't',
      estudiante: 'e',
      estado,
    }));
    const r = tareasPorRevisar(tareas);
    expect(r.total).toBe(4);
    expect(r.lista.map(t => t.id)).toEqual(['0', '2', '3']);
  });
});

describe('caso de uso y vista', () => {
  it('error solo si fallan todas; si no, cada sección por separado', async () => {
    const falla = () => Promise.resolve(respuestaError<never>('sin red', 0));
    const todoMal: InicioProfeRepository = {
      listarClases: falla,
      listarEstudiantes: falla,
      listarAsistenciasPendientes: falla,
      listarTareas: falla,
      contarNoLeidos: falla,
    };
    expect(
      await obtenerResumenInicioProfeUseCase(todoMal, { idProfe: PROFE }),
    ).toMatchObject({ error: true, msg: 'sin red', code: 0 });

    const parcial: InicioProfeRepository = {
      ...crearMemoriaInicioProfeRepository({ clases: [clase()], noLeidos: 4 }),
      listarTareas: falla,
    };
    const r = await obtenerResumenInicioProfeUseCase(parcial, {
      idProfe: PROFE,
    });
    expect(r.error).toBe(false);
    const vista = construirVistaInicioProfe(r.response!, PROFE, AHORA, 'Est.');
    expect(vista.hoy).toMatchObject({
      ok: true,
      datos: { destacada: { id: '1', momento: 'proxima', estudiante: 'Est.' } },
    });
    expect(vista.tareas).toEqual({ ok: false, msg: 'sin red' });
    expect(vista.noLeidos).toBe(4);
    expect(vista.noLeidosOk).toBe(true);
  });

  it('vista: clases caídas dan error en hoy; asistencias muestra 3 y el total', () => {
    const asistencias = ['1', '2', '3', '4'].map(id => ({
      id,
      estudiante: 'Ana',
      fecha: '2026-11-16',
      hora: '10:00',
    }));
    const vista = construirVistaInicioProfe(
      {
        clases: { ok: false, msg: 'caído' },
        estudiantes: { ok: false, msg: 'caído' },
        asistencias: { ok: true, datos: asistencias },
        tareas: { ok: true, datos: [] },
        noLeidos: { ok: false, msg: 'caído' },
      },
      PROFE,
      AHORA,
      '',
    );
    expect(vista.hoy).toEqual({ ok: false, msg: 'caído' });
    expect(vista.asistencias).toMatchObject({ ok: true, datos: { total: 4 } });
    expect(vista.asistencias.ok && vista.asistencias.datos.lista).toHaveLength(
      3,
    );
    expect(vista.noLeidos).toBe(0);
    expect(vista.noLeidosOk).toBe(false);
  });
});

describe('mapeo de Leap', () => {
  it('claseProfeDe usa la reprogramación (fecha, hora y profe nuevos) si existe', () => {
    expect(
      claseProfeDe({
        id: 7,
        student_id: 's1',
        teacher_id: 't1',
        new_teacher_id: 't2',
        scheduled_date: '2026-11-16',
        scheduled_time: '10:00',
        new_date: '2026-11-17',
        new_time: '15:00',
        status: 'rescheduled',
        class_number: '4',
        teacher_zoom_url: 'https://zoom',
      }),
    ).toEqual({
      id: '7',
      idEstudiante: 's1',
      fecha: '2026-11-17',
      hora: '15:00',
      idProfe: 't2',
      estado: 'rescheduled',
      numeroClase: 4,
      enlaceZoom: 'https://zoom',
    });
    expect(
      claseProfeDe({ id: 1, teacher_id: 't1', scheduled_date: '2026-11-17' }),
    ).toMatchObject({
      hora: '',
      estado: '',
      numeroClase: null,
      idEstudiante: '',
    });
    expect(claseProfeDe({ id: 1, scheduled_date: '2026-11-17' })).toBeNull();
    expect(claseProfeDe({ teacher_id: 't1', scheduled_date: 'x' })).toBeNull();
  });

  it('estudiantes, asistencias y tareas: descartan filas sin id', () => {
    expect(estudianteDe({ id: 3, name: ' Ana ' })).toEqual({
      id: '3',
      nombre: 'Ana',
    });
    expect(estudianteDe({ name: 'x' })).toBeNull();
    expect(
      asistenciaDe({
        id: 1,
        student_name: 'Ana',
        fecha: '2026-11-16',
        hora: '10:00',
      }),
    ).toEqual({
      id: '1',
      estudiante: 'Ana',
      fecha: '2026-11-16',
      hora: '10:00',
    });
    expect(asistenciaDe({ id: 1 })).toBeNull();
    expect(
      tareaRevisionDe({ id: 2, title: 'Essay', status: 'ready_review' }),
    ).toEqual({
      id: '2',
      titulo: 'Essay',
      estudiante: '',
      estado: 'ready_review',
    });
    expect(tareaRevisionDe({})).toBeNull();
  });
});

describe('apiInicioProfeRepository', () => {
  function montar(cuerpo: unknown, status = 200) {
    const fetchImpl = jest.fn(() =>
      Promise.resolve({
        ok: status < 300,
        status,
        text: () => Promise.resolve(JSON.stringify(cuerpo)),
      } as unknown as Response),
    );
    const api = crearClienteApi({
      urlBase: 'http://h/api',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      obtenerToken: () => Promise.resolve('tok'),
    });
    const llamada = () => {
      const [url, init] = fetchImpl.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      return {
        url,
        metodo: init.method,
        cuerpo: init.body ? JSON.parse(String(init.body)) : undefined,
      };
    };
    return { repo: crearApiInicioProfeRepository(api), llamada };
  }

  it('clases: GET class_sessions&all_teacher=1', async () => {
    const { repo, llamada } = montar([
      { id: 1, teacher_id: 't1', scheduled_date: '2026-11-17' },
    ]);
    const r = await repo.listarClases();
    expect(llamada().url).toContain('endpoint=class_sessions');
    expect(llamada().url).toContain('all_teacher=1');
    expect(r.response).toHaveLength(1);
  });

  it('estudiantes: GET students&role=teacher', async () => {
    const { repo, llamada } = montar([{ id: 's1', name: 'Ana' }]);
    await repo.listarEstudiantes();
    expect(llamada().url).toContain('endpoint=students');
    expect(llamada().url).toContain('role=teacher');
  });

  it('asistencias: POST pending_attendance con el teacherId de la sesión', async () => {
    const { repo, llamada } = montar([]);
    await repo.listarAsistenciasPendientes({ idProfe: 't1' });
    expect(llamada().metodo).toBe('POST');
    expect(llamada().url).toContain('endpoint=class_sessions');
    expect(llamada().cuerpo).toEqual({
      action: 'pending_attendance',
      teacherId: 't1',
    });
  });

  it('tareas: GET tasks&teacher_id', async () => {
    const { repo, llamada } = montar([]);
    await repo.listarTareas({ idProfe: 't1' });
    expect(llamada().url).toContain('endpoint=tasks');
    expect(llamada().url).toContain('teacher_id=t1');
  });

  it('no leídos: POST chispa get_unread con rol teacher; total, formato inválido y error', async () => {
    const ok = montar({ total: '3', unreadMap: { s1: 3 } });
    expect((await ok.repo.contarNoLeidos({ idProfe: 't1' })).response).toBe(3);
    expect(ok.llamada().cuerpo).toEqual({
      action: 'get_unread',
      role: 'teacher',
      teacherId: 't1',
    });
    const raro = montar({});
    expect((await raro.repo.contarNoLeidos({ idProfe: 't1' })).error).toBe(
      true,
    );
    const caido = montar({ error: 'boom' }, 500);
    expect(await caido.repo.contarNoLeidos({ idProfe: 't1' })).toMatchObject({
      error: true,
      code: 500,
    });
  });
});

describe('vista con estudiantes o asistencias caídos', () => {
  it('sin estudiantes las clases salen con el nombre genérico; asistencias conserva su error', () => {
    const vista = construirVistaInicioProfe(
      {
        clases: { ok: true, datos: [clase()] },
        estudiantes: { ok: false, msg: 'caído' },
        asistencias: { ok: false, msg: 'sin permiso' },
        tareas: { ok: false, msg: 'caído' },
        noLeidos: { ok: true, datos: 0 },
      },
      PROFE,
      AHORA,
      'Estudiante',
    );
    expect(vista.hoy.ok && vista.hoy.datos.clases[0].estudiante).toBe(
      'Estudiante',
    );
    expect(vista.asistencias).toEqual({ ok: false, msg: 'sin permiso' });
  });
});
