// F1-05: caso de uso del resumen (secciones independientes, CA13) y vista calculada (CA9-CA12).
import { obtenerResumenInicioUseCase } from '@/modules/inicio/aplications/obtenerResumenInicio/obtenerResumenInicio';
import { construirVistaInicio } from '@/modules/inicio/aplications/vistaInicio/vistaInicio';
import type {
  IResumenInicio,
  IResponseSesionClase,
} from '@/modules/inicio/domain/entities/Inicio.entities';
import type { InicioRepository } from '@/modules/inicio/domain/models/InicioRepository';
import { crearMemoriaInicioRepository } from '@/modules/inicio/infrastructure/memoriaInicioRepository';
import { respuestaError } from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const ARGS = { idEstudiante: 's1' };

const clase: IResponseSesionClase = {
  id: '7',
  fecha: '2026-11-18',
  hora: '18:00',
  estado: 'scheduled',
  cuentaComoTomada: false,
  inicioCiclo: '2026-11-15',
  finCiclo: '2026-12-14',
  fechaNueva: null,
  horaNueva: null,
  profe: 'Meli',
  enlaceZoom: null,
};

const falla = () => Promise.resolve(respuestaError<never>('caído', 500));

function repoQueFalla(
  claves: (keyof InicioRepository)[],
  base = crearMemoriaInicioRepository(),
): InicioRepository {
  const repo = { ...base };
  for (const c of claves) {
    repo[c] = falla as never;
  }
  return repo;
}

describe('obtenerResumenInicioUseCase', () => {
  it('lee las seis secciones con el id del estudiante', async () => {
    const base = crearMemoriaInicioRepository({ noLeidos: 2 });
    const repo: InicioRepository = {
      obtenerPlan: jest.fn(base.obtenerPlan),
      listarClases: jest.fn(base.listarClases),
      listarHorario: jest.fn(base.listarHorario),
      listarTareas: jest.fn(base.listarTareas),
      contarNoLeidos: jest.fn(base.contarNoLeidos),
      listarMensajes: jest.fn(base.listarMensajes),
    };
    const r = await obtenerResumenInicioUseCase(repo, ARGS);
    expect(r.error).toBe(false);
    expect(r.response?.noLeidos).toEqual({ ok: true, datos: 2 });
    for (const metodo of [
      repo.listarClases,
      repo.listarHorario,
      repo.listarTareas,
      repo.contarNoLeidos,
      repo.listarMensajes,
    ]) {
      expect(metodo).toHaveBeenCalledWith(ARGS);
    }
    expect(repo.obtenerPlan).toHaveBeenCalledTimes(1);
  });

  it('si falla una sección, las demás siguen y esa lleva su mensaje', async () => {
    const r = await obtenerResumenInicioUseCase(
      repoQueFalla(['listarTareas']),
      ARGS,
    );
    expect(r.error).toBe(false);
    expect(r.response?.tareas).toEqual({ ok: false, msg: 'caído' });
    expect(r.response?.clases).toEqual({ ok: true, datos: [] });
  });

  it('una sección sin mensaje usa el error genérico', async () => {
    const repo = {
      ...crearMemoriaInicioRepository(),
      listarMensajes: () => Promise.resolve({ error: true }),
    } as InicioRepository;
    const r = await obtenerResumenInicioUseCase(repo, ARGS);
    expect(r.response?.mensajes).toEqual({
      ok: false,
      msg: textosComunes.errores.desconocido,
    });
  });

  it('si fallan todas es error, con el mensaje y el código de la primera', async () => {
    const todas: (keyof InicioRepository)[] = [
      'obtenerPlan',
      'listarClases',
      'listarHorario',
      'listarTareas',
      'contarNoLeidos',
      'listarMensajes',
    ];
    expect(
      await obtenerResumenInicioUseCase(repoQueFalla(todas), ARGS),
    ).toEqual({ error: true, msg: 'caído', code: 500 });
    const sinMsg = Object.fromEntries(
      todas.map(c => [c, () => Promise.resolve({ error: true })]),
    ) as unknown as InicioRepository;
    expect((await obtenerResumenInicioUseCase(sinMsg, ARGS)).msg).toBe(
      textosComunes.errores.desconocido,
    );
  });
});

describe('construirVistaInicio', () => {
  const resumen = (parcial: Partial<IResumenInicio> = {}): IResumenInicio => ({
    plan: {
      ok: true,
      datos: {
        plan: 'Progress',
        ciclo: { inicio: '2026-11-15', fin: '2026-12-14' },
        cancelacionesUsadas: 1,
        cancelacionesMaximas: 3,
      },
    },
    clases: { ok: true, datos: [clase] },
    horario: {
      ok: true,
      datos: [{ diaSemana: 3, hora: '18:00', duracionMin: 55 }],
    },
    tareas: {
      ok: true,
      datos: [{ id: '1', titulo: 'A', estado: 'pending', venceEl: null }],
    },
    noLeidos: { ok: true, datos: 2 },
    mensajes: {
      ok: true,
      datos: [
        {
          id: '1',
          remitente: 'Meli',
          deEstudiante: false,
          texto: 'Hola',
          adjunto: null,
          enviadoEl: '2026-11-17 08:00:00',
        },
      ],
    },
    ...parcial,
  });

  it('calcula todas las secciones', () => {
    const v = construirVistaInicio(resumen(), AHORA);
    expect(v.plan).toEqual({
      ok: true,
      datos: {
        nombre: 'Progress',
        ciclo: { inicio: '2026-11-15', fin: '2026-12-14' },
        cancelaciones: { disponibles: 2, maximas: 3, horasAviso: 12 },
      },
    });
    expect(v.proximaClase.ok && v.proximaClase.datos.clase?.duracionMin).toBe(
      55,
    );
    expect(v.proximaClase.ok && v.proximaClase.datos.cuentaAtras).toEqual({
      tipo: 'dias',
      valor: 1,
    });
    expect(v.ciclo).toEqual({
      ok: true,
      datos: { tomadas: 0, total: 12, fraccion: 0 },
    });
    expect(v.tareas.ok && v.tareas.datos.total).toBe(1);
    expect(v.mensajes.ok && v.mensajes.datos.noLeidos).toBe(2);
    expect(v.noLeidos).toBe(2);
  });

  it('sin próxima clase la cuenta atrás es null', () => {
    const v = construirVistaInicio(
      resumen({ clases: { ok: true, datos: [] } }),
      AHORA,
    );
    expect(v.proximaClase).toEqual({
      ok: true,
      datos: { clase: null, cuentaAtras: null },
    });
  });

  it('conserva el error de cada sección y no inventa datos', () => {
    const error = { ok: false as const, msg: 'caído' };
    const v = construirVistaInicio(
      resumen({
        plan: error,
        clases: error,
        horario: error,
        tareas: error,
        noLeidos: error,
        mensajes: error,
      }),
      AHORA,
    );
    expect(v.plan).toEqual(error);
    expect(v.proximaClase).toEqual(error);
    expect(v.ciclo).toEqual(error);
    expect(v.tareas).toEqual(error);
    expect(v.mensajes).toEqual(error);
    expect(v.noLeidos).toBe(0);
  });

  it('sin plan ni horario, la clase sale sin duración y el ciclo sin total', () => {
    const error = { ok: false as const, msg: 'caído' };
    const v = construirVistaInicio(
      resumen({ plan: error, horario: error, noLeidos: error }),
      AHORA,
    );
    expect(v.proximaClase.ok && v.proximaClase.datos.clase?.duracionMin).toBe(
      null,
    );
    expect(v.ciclo.ok && v.ciclo.datos.total).toBeNull();
    expect(v.mensajes.ok && v.mensajes.datos.noLeidos).toBeNull();
  });
});
