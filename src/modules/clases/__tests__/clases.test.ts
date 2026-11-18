// F2-01 (2.1): historial de clases. Dominio (estados, ciclos, próxima), caso de uso y adaptador de
// Leap con un fetch falso.
import { obtenerClasesUseCase } from '@/modules/clases/aplications/obtenerClases/obtenerClases';
import type { IResponseClase } from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import {
  ciclosDeClases,
  claseHistorial,
  estadoVisible,
  indiceCicloInicial,
  resumenCiclo,
} from '@/modules/clases/domain/validations/clases.validations';
import {
  claseDe,
  crearApiClasesRepository,
} from '@/modules/clases/infrastructure/apiClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { crearClienteApi } from '@/shared/lib/api';
import { respuestaError } from '@/shared/lib/HttpResponse';

// 17 nov 2026, 10:00 en Bogotá (= 15:00 UTC).
const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const ACTUAL = { inicioCiclo: '2026-11-05', finCiclo: '2026-12-04' };
const ANTERIOR = { inicioCiclo: '2026-10-05', finCiclo: '2026-11-04' };

const clase = (cambios: Partial<IResponseClase> = {}): IResponseClase => ({
  id: '1',
  fecha: '2026-11-18',
  hora: '18:00',
  estado: 'scheduled',
  cuentaComoTomada: false,
  numeroClase: 1,
  fechaNueva: null,
  horaNueva: null,
  profe: 'Meli',
  enlaceZoom: 'https://zoom.us/j/1',
  ...ACTUAL,
  ...cambios,
});

describe('estadoVisible', () => {
  it.each([
    ['scheduled', 'Programada', 'neutra'],
    ['taken', 'Tomada', 'exito'],
    ['no_show', 'No asististe', 'aviso'],
    ['cancelled_no_tokens', 'Cancelada sin cupo', 'peligro'],
    ['holiday_impacts_min', 'Festivo · por reagendar', 'aviso'],
    ['rescheduled_taken', 'Reagendada · tomada', 'exito'],
    ['medical_exception', 'Excepción médica', 'neutra'],
    ['expired', 'Vencida', 'aviso'],
  ])('%s → «%s» (%s)', (estado, etiqueta, tono) => {
    expect(estadoVisible(estado)).toEqual({ etiqueta, tono });
  });

  it('un estado desconocido se muestra tal cual y uno vacío, como «Sin estado»', () => {
    expect(estadoVisible('algo_nuevo')).toEqual({
      etiqueta: 'algo_nuevo',
      tono: 'neutra',
    });
    expect(estadoVisible('')).toEqual({
      etiqueta: 'Sin estado',
      tono: 'neutra',
    });
  });
});

describe('claseHistorial', () => {
  it('una reagendada usa la fecha y hora nuevas y guarda la original', () => {
    const c = claseHistorial(
      clase({
        estado: 'rescheduled',
        fecha: '2026-11-16',
        hora: '10:00',
        fechaNueva: '2026-11-20',
        horaNueva: '15:00',
      }),
    );
    expect(c).toMatchObject({
      fecha: '2026-11-20',
      hora: '15:00',
      fechaOriginal: '2026-11-16',
    });
    expect(c.inicioMs).toBe(Date.UTC(2026, 10, 20, 20, 0));
  });

  it('sin hora nueva conserva la hora; sin fecha nueva o sin reagendar, nada cambia', () => {
    expect(
      claseHistorial(
        clase({
          estado: 'rescheduled_taken',
          fechaNueva: '2026-11-20',
          hora: '09:00',
        }),
      ),
    ).toMatchObject({ fecha: '2026-11-20', hora: '09:00' });
    expect(
      claseHistorial(clase({ estado: 'rescheduled', fechaNueva: null })),
    ).toMatchObject({ fecha: '2026-11-18', fechaOriginal: null });
    expect(
      claseHistorial(clase({ estado: 'scheduled', fechaNueva: '2026-12-01' })),
    ).toMatchObject({ fecha: '2026-11-18', fechaOriginal: null });
  });

  it('una fecha inválida deja el instante en null', () => {
    expect(claseHistorial(clase({ fecha: 'x', hora: '' })).inicioMs).toBeNull();
  });
});

describe('resumenCiclo', () => {
  it('cuenta tomadas (sin los no_impact), programadas futuras, por reagendar y canceladas', () => {
    const r = resumenCiclo(
      [
        clase({
          id: 'a',
          estado: 'taken',
          cuentaComoTomada: true,
          fecha: '2026-11-10',
        }),
        clase({
          id: 'b',
          estado: 'cancelled_no_impact',
          cuentaComoTomada: true,
        }),
        clase({ id: 'c', estado: 'scheduled', fecha: '2026-11-17' }),
        clase({ id: 'd', estado: 'scheduled', fecha: '2026-11-16' }),
        clase({
          id: 'e',
          estado: 'rescheduled',
          fecha: '2026-11-01',
          fechaNueva: '2026-11-25',
        }),
        clase({ id: 'f', estado: 'to_reschedule' }),
        clase({ id: 'g', estado: 'vacation_hold' }),
        clase({ id: 'h', estado: 'cancelled_late' }),
        clase({ id: 'i', estado: 'cancelled_no_tokens' }),
      ],
      AHORA,
    );
    expect(r).toEqual({
      tomadas: 1,
      programadas: 2,
      porReagendar: 2,
      canceladas: 3,
    });
  });
});

describe('ciclosDeClases', () => {
  const clases = [
    clase({ id: 'a2', fecha: '2026-11-20', hora: '10:00' }),
    clase({
      id: 'a1',
      fecha: '2026-11-17',
      hora: '08:00',
      estado: 'taken',
      cuentaComoTomada: true,
    }),
    clase({ id: 'a3', fecha: '2026-11-17', hora: '18:00' }),
    clase({
      id: 'p1',
      fecha: '2026-10-20',
      estado: 'taken',
      cuentaComoTomada: true,
      ...ANTERIOR,
    }),
    clase({ id: 's1', fecha: '2026-09-01', inicioCiclo: null, finCiclo: null }),
  ];

  it('agrupa por ciclo, del más reciente al más antiguo, y marca el actual', () => {
    const r = ciclosDeClases(clases, AHORA);
    expect(r.map(c => c.id)).toEqual([
      '2026-11-05|2026-12-04',
      '2026-10-05|2026-11-04',
      '|',
    ]);
    expect(r.map(c => c.esActual)).toEqual([true, false, false]);
    expect(r[2]).toMatchObject({ inicio: null, fin: null });
  });

  it('ordena las clases del ciclo por fecha y hora', () => {
    const [actual] = ciclosDeClases(clases, AHORA);
    expect(actual.clases.map(c => c.id)).toEqual(['a1', 'a3', 'a2']);
  });

  it('la próxima es la primera programada que no pasó; sigue 50 min tras empezar', () => {
    const [actual] = ciclosDeClases(clases, AHORA);
    expect(actual.proximaId).toBe('a3');
    // 19:20 en Bogotá: la de las 18:00 ya pasó hace más de 50 min → la siguiente.
    const tarde = Date.UTC(2026, 10, 18, 0, 20);
    expect(ciclosDeClases(clases, tarde)[0].proximaId).toBe('a2');
    // 18:30: sigue en curso.
    const enCurso = Date.UTC(2026, 10, 17, 23, 30);
    expect(ciclosDeClases(clases, enCurso)[0].proximaId).toBe('a3');
    expect(
      ciclosDeClases(clases, Date.UTC(2027, 0, 1))[0].proximaId,
    ).toBeNull();
  });

  it('sin clases no hay ciclos', () => {
    expect(ciclosDeClases([], AHORA)).toEqual([]);
  });

  it('indiceCicloInicial: el actual; si ninguno lo es, el más reciente', () => {
    const r = ciclosDeClases(clases, AHORA);
    expect(indiceCicloInicial(r)).toBe(0);
    expect(indiceCicloInicial(ciclosDeClases([clases[3]], AHORA))).toBe(0);
    const [, anterior, sinCiclo] = r;
    expect(indiceCicloInicial([anterior, sinCiclo])).toBe(0);
    // El actual puede no ser el primero (p. ej. ciclos futuros ya generados).
    expect(indiceCicloInicial([anterior, r[0]])).toBe(1);
  });
});

describe('obtenerClasesUseCase', () => {
  it('devuelve lo del repositorio y completa un error sin mensaje', async () => {
    const ok = crearMemoriaClasesRepository([clase()]);
    expect(
      (await obtenerClasesUseCase(ok, { idEstudiante: 's1' })).response,
    ).toHaveLength(1);
    const sinMensaje = {
      ...crearMemoriaClasesRepository(),
      listarClases: () => Promise.resolve({ error: true, code: 500 }),
    } as unknown as ClasesRepository;
    expect(
      await obtenerClasesUseCase(sinMensaje, { idEstudiante: 's1' }),
    ).toMatchObject({
      error: true,
      msg: 'Ocurrió un error inesperado.',
      code: 500,
    });
    const conMensaje: ClasesRepository = {
      ...crearMemoriaClasesRepository(),
      listarClases: () => Promise.resolve(respuestaError('Sin red', 0)),
    };
    expect(
      (await obtenerClasesUseCase(conMensaje, { idEstudiante: 's1' })).msg,
    ).toBe('Sin red');
  });
});

describe('apiClasesRepository', () => {
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
    return { repo: crearApiClasesRepository(api), fetchImpl };
  }

  it('pide class_sessions del estudiante y mapea los campos de Leap', async () => {
    const { repo, fetchImpl } = montar([
      {
        id: 7,
        scheduled_date: '2026-11-18',
        scheduled_time: '18:00',
        status: 'rescheduled',
        counts_as_taken: '1',
        class_number: '3',
        cycle_start: '2026-11-05',
        cycle_end: '2026-12-04',
        new_date: '2026-11-20',
        new_time: '15:00',
        teacher_name: ' Meli ',
        teacher_zoom_url: 'https://zoom.us/j/9',
      },
      { id: 8 },
      null,
    ]);
    const r = await repo.listarClases({ idEstudiante: 's1' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('endpoint=class_sessions');
    expect(url).toContain('student_id=s1');
    expect(r.response).toEqual([
      {
        id: '7',
        fecha: '2026-11-18',
        hora: '18:00',
        estado: 'rescheduled',
        cuentaComoTomada: true,
        numeroClase: 3,
        inicioCiclo: '2026-11-05',
        finCiclo: '2026-12-04',
        fechaNueva: '2026-11-20',
        horaNueva: '15:00',
        profe: 'Meli',
        enlaceZoom: 'https://zoom.us/j/9',
      },
    ]);
  });

  it('claseDe: counts_as_taken acepta true, numérico o texto; sin id o fecha se descarta', () => {
    expect(
      claseDe({ id: 1, scheduled_date: '2026-11-18', counts_as_taken: true })
        ?.cuentaComoTomada,
    ).toBe(true);
    expect(
      claseDe({ id: 1, scheduled_date: '2026-11-18', counts_as_taken: 0 })
        ?.cuentaComoTomada,
    ).toBe(false);
    expect(
      claseDe({ id: 1, scheduled_date: '2026-11-18', class_number: 'x' }),
    ).toMatchObject({
      numeroClase: null,
      hora: '',
      estado: '',
    });
    expect(claseDe({ scheduled_date: '2026-11-18' })).toBeNull();
    expect(claseDe({ id: 1 })).toBeNull();
  });

  it('una respuesta que no es lista, o un error HTTP, son errores legibles', async () => {
    const raro = await montar({ nada: true }).repo.listarClases({
      idEstudiante: 's1',
    });
    expect(raro.error).toBe(true);
    const caido = await montar({ error: 'boom' }, 500).repo.listarClases({
      idEstudiante: 's1',
    });
    expect(caido).toMatchObject({ error: true, code: 500, msg: 'boom' });
  });
});
