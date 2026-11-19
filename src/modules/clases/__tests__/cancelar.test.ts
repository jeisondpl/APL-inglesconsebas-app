// F2-01 (2.2): cancelar una clase. La App no decide: pide a Leap qué pasaría, deja elegir si el
// servidor ofrece opciones y confirma. Aquí: la regla del botón, los casos de uso y el adaptador.
import {
  cancelarClaseUseCase,
  vistaPreviaCancelacionUseCase,
} from '@/modules/clases/aplications/cancelarClase/cancelarClase';
import { mensajesClases } from '@/modules/clases/domain/clases.mensajes';
import type {
  IClaseHistorial,
  VistaPreviaCancelacion,
} from '@/modules/clases/domain/entities/Clases.entities';
import type { ClasesRepository } from '@/modules/clases/domain/models/ClasesRepository';
import { puedeIntentarCancelar } from '@/modules/clases/domain/validations/clases.validations';
import {
  crearApiClasesRepository,
  vistaPreviaDe,
} from '@/modules/clases/infrastructure/apiClasesRepository';
import { crearMemoriaClasesRepository } from '@/modules/clases/infrastructure/memoriaClasesRepository';
import { crearClienteApi } from '@/shared/lib/api';
import { respuestaError } from '@/shared/lib/HttpResponse';

const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const HORA = 60 * 60 * 1000;

const historial = (
  cambios: Partial<IClaseHistorial> = {},
): IClaseHistorial => ({
  id: '1',
  fecha: '2026-11-18',
  hora: '18:00',
  fechaOriginal: null,
  estado: 'scheduled',
  numeroClase: 1,
  profe: 'Meli',
  enlaceZoom: null,
  inicioMs: AHORA + 5 * HORA,
  ...cambios,
});

const VISTA: Extract<VistaPreviaCancelacion, { puede: true }> = {
  puede: true,
  escenario: 'elige',
  estadoFinal: 'cancelled_no_impact',
  opciones: [
    {
      opcion: 'reagendar',
      estado: 'cancelled_impacts_min',
      descuentaToken: true,
    },
    { opcion: 'soltar', estado: 'cancelled_no_impact', descuentaToken: false },
  ],
  descuentaToken: false,
  fecha: '2026-11-18',
  hora: '18:00',
  horasRestantes: 22,
  tokensUsados: 0,
  tokensMaximos: 2,
  afectaMinimo: false,
  minimo: 8,
  enGrupo: false,
};

describe('puedeIntentarCancelar', () => {
  it('programada o reagendada que aún no empezó: sí', () => {
    expect(puedeIntentarCancelar(historial(), AHORA)).toBe(true);
    expect(
      puedeIntentarCancelar(historial({ estado: 'rescheduled' }), AHORA),
    ).toBe(true);
  });

  it.each([
    'taken',
    'no_show',
    'cancelled_late',
    'to_reschedule',
    'expired',
    'rescheduled_taken',
  ])('%s: no', estado => {
    expect(puedeIntentarCancelar(historial({ estado }), AHORA)).toBe(false);
  });

  it('ya empezó o sin fecha válida: no', () => {
    expect(
      puedeIntentarCancelar(historial({ inicioMs: AHORA - 1 }), AHORA),
    ).toBe(false);
    expect(puedeIntentarCancelar(historial({ inicioMs: AHORA }), AHORA)).toBe(
      false,
    );
    expect(puedeIntentarCancelar(historial({ inicioMs: null }), AHORA)).toBe(
      false,
    );
  });
});

describe('casos de uso de cancelar', () => {
  it('vista previa: devuelve lo de Leap y completa un error sin mensaje', async () => {
    const ok = crearMemoriaClasesRepository([], {
      vistasPrevias: { '1': VISTA },
    });
    expect((await vistaPreviaCancelacionUseCase(ok, '1')).response).toEqual(
      VISTA,
    );
    const sinMensaje = {
      vistaPreviaCancelacion: () => Promise.resolve({ error: true, code: 500 }),
    } as unknown as ClasesRepository;
    expect(await vistaPreviaCancelacionUseCase(sinMensaje, '1')).toMatchObject({
      error: true,
      msg: 'Ocurrió un error inesperado.',
    });
    const conMensaje = {
      vistaPreviaCancelacion: () =>
        Promise.resolve(respuestaError('Sin red', 0)),
    } as unknown as ClasesRepository;
    expect((await vistaPreviaCancelacionUseCase(conMensaje, '1')).msg).toBe(
      'Sin red',
    );
  });

  it('no llama a Leap si la vista dice que no se puede', async () => {
    const repo = crearMemoriaClasesRepository();
    const espia = jest.spyOn(repo, 'cancelarClase');
    const r = await cancelarClaseUseCase(
      repo,
      { idClase: '1' },
      { puede: false, motivo: 'ya_empezo' },
    );
    expect(r).toMatchObject({
      error: true,
      msg: mensajesClases.noSePuedeCancelar,
    });
    expect(espia).not.toHaveBeenCalled();
  });

  it('con opciones exige una válida antes de llamar', async () => {
    const repo = crearMemoriaClasesRepository([], {
      vistasPrevias: { '1': VISTA },
    });
    const espia = jest.spyOn(repo, 'cancelarClase');
    expect(
      await cancelarClaseUseCase(repo, { idClase: '1' }, VISTA),
    ).toMatchObject({
      error: true,
      msg: mensajesClases.eligeOpcion,
    });
    expect(
      await cancelarClaseUseCase(
        repo,
        { idClase: '1', opcion: 'inventada' as never },
        VISTA,
      ),
    ).toMatchObject({ error: true });
    expect(espia).not.toHaveBeenCalled();
    const r = await cancelarClaseUseCase(
      repo,
      { idClase: '1', opcion: 'soltar' },
      VISTA,
    );
    expect(r.response).toEqual({ estadoFinal: 'cancelled_no_impact' });
    expect(espia).toHaveBeenCalledWith({ idClase: '1', opcion: 'soltar' });
  });

  it('sin opciones cancela directo; un error sin mensaje se completa', async () => {
    const vista = { ...VISTA, escenario: 'sin_tokens' as const, opciones: [] };
    const repo = crearMemoriaClasesRepository([], {
      vistasPrevias: { '1': vista },
    });
    expect(
      (await cancelarClaseUseCase(repo, { idClase: '1' }, vista)).response,
    ).toBeDefined();
    const sinMensaje = {
      cancelarClase: () => Promise.resolve({ error: true, code: 500 }),
    } as unknown as ClasesRepository;
    expect(
      await cancelarClaseUseCase(sinMensaje, { idClase: '1' }, vista),
    ).toMatchObject({
      error: true,
      msg: 'Ocurrió un error inesperado.',
    });
  });
});

describe('vistaPreviaDe (mapeo de Leap)', () => {
  const crudo = {
    puede: true,
    escenario: 'power_elige',
    estadoFinal: 'cancelled_no_impact',
    opciones: [
      {
        opcion: 'reagendar',
        estado: 'cancelled_impacts_min',
        descuentaToken: true,
      },
      { opcion: 'soltar', estado: 'cancelled_no_impact', descuentaToken: true },
      { opcion: 'rara', estado: 'x' },
      { opcion: 'soltar' },
    ],
    descuentaToken: true,
    fecha: '2026-11-18',
    hora: '18:00',
    horasRestantes: '25.5',
    tokensUsados: '1',
    tokensMaximos: 8,
    afectaMinimo: false,
    minimo: 8,
    enGrupo: true,
  };

  it('mapea la vista y descarta opciones desconocidas o incompletas', () => {
    expect(vistaPreviaDe(crudo)).toEqual({
      puede: true,
      escenario: 'power_elige',
      estadoFinal: 'cancelled_no_impact',
      opciones: [
        {
          opcion: 'reagendar',
          estado: 'cancelled_impacts_min',
          descuentaToken: true,
        },
        {
          opcion: 'soltar',
          estado: 'cancelled_no_impact',
          descuentaToken: true,
        },
      ],
      descuentaToken: true,
      fecha: '2026-11-18',
      hora: '18:00',
      horasRestantes: 25.5,
      tokensUsados: 1,
      tokensMaximos: 8,
      afectaMinimo: false,
      minimo: 8,
      enGrupo: true,
    });
  });

  it('puede:false conserva el motivo (o uno por defecto)', () => {
    expect(vistaPreviaDe({ puede: false, motivo: 'ya_empezo' })).toEqual({
      puede: false,
      motivo: 'ya_empezo',
    });
    expect(vistaPreviaDe({ puede: false })).toEqual({
      puede: false,
      motivo: 'no_cancelable',
    });
  });

  it('un escenario desconocido, o datos que faltan, es un error de formato (null)', () => {
    expect(vistaPreviaDe({ ...crudo, escenario: 'nuevo_de_leap' })).toBeNull();
    expect(vistaPreviaDe({ ...crudo, estadoFinal: undefined })).toBeNull();
    expect(vistaPreviaDe({ ...crudo, fecha: undefined })).toBeNull();
    expect(vistaPreviaDe({})).toBeNull();
  });

  it('sin números ni opciones usa ceros y lista vacía', () => {
    const v = vistaPreviaDe({
      puede: true,
      escenario: 'sin_tokens',
      estadoFinal: 'cancelled_no_tokens',
      fecha: '2026-11-18',
    });
    expect(v).toMatchObject({
      puede: true,
      opciones: [],
      hora: '',
      horasRestantes: 0,
      tokensUsados: 0,
      tokensMaximos: 0,
      minimo: 0,
      enGrupo: false,
      descuentaToken: false,
    });
  });
});

describe('apiClasesRepository · cancelar', () => {
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
        cuerpo: JSON.parse(String(init.body)),
      };
    };
    return { repo: crearApiClasesRepository(api), llamada };
  }

  it('vista previa: POST class_sessions cancel_preview con el id', async () => {
    const { repo, llamada } = montar({
      puede: true,
      escenario: 'sin_tokens',
      estadoFinal: 'cancelled_no_tokens',
      fecha: '2026-11-18',
    });
    const r = await repo.vistaPreviaCancelacion('28');
    expect(llamada().metodo).toBe('POST');
    expect(llamada().url).toContain('endpoint=class_sessions');
    expect(llamada().cuerpo).toEqual({ action: 'cancel_preview', id: '28' });
    expect(r.response).toMatchObject({ puede: true, escenario: 'sin_tokens' });
  });

  it('vista previa: error de Leap, formato raro y sin mensaje', async () => {
    const caido = montar(
      { error: 'No tienes acceso a estos datos.', code: 'not_owner' },
      403,
    );
    expect(await caido.repo.vistaPreviaCancelacion('1')).toMatchObject({
      error: true,
      code: 403,
      msg: 'No tienes acceso a estos datos.',
    });
    const raro = montar({ puede: true, escenario: 'inventado' });
    expect((await raro.repo.vistaPreviaCancelacion('1')).error).toBe(true);
  });

  it('cancelar: POST student_cancel con id y opción (solo si hay)', async () => {
    const con = montar({ ok: true, finalStatus: 'to_reschedule' });
    const r = await con.repo.cancelarClase({
      idClase: '29',
      opcion: 'reagendar',
    });
    expect(con.llamada().cuerpo).toEqual({
      action: 'student_cancel',
      id: '29',
      opcion: 'reagendar',
    });
    expect(r.response).toEqual({ estadoFinal: 'to_reschedule' });
    const sin = montar({ ok: true, finalStatus: 'cancelled_no_tokens' });
    await sin.repo.cancelarClase({ idClase: '30' });
    expect(sin.llamada().cuerpo).toEqual({
      action: 'student_cancel',
      id: '30',
    });
  });

  it('cancelar: 409 de Leap con su mensaje; sin finalStatus es error de formato', async () => {
    const e409 = montar(
      { error: 'Esta clase ya empezó.', code: 'rule_violation' },
      409,
    );
    expect(await e409.repo.cancelarClase({ idClase: '1' })).toMatchObject({
      error: true,
      code: 409,
      msg: 'Esta clase ya empezó.',
    });
    const raro = montar({ ok: true });
    expect((await raro.repo.cancelarClase({ idClase: '1' })).error).toBe(true);
  });
});

describe('repositorio en memoria', () => {
  it('sin vista previa: «no se puede»; cancelar sin vista da 409; con resultado fijo, ese', async () => {
    const vacio = crearMemoriaClasesRepository();
    expect((await vacio.vistaPreviaCancelacion('9')).response).toEqual({
      puede: false,
      motivo: 'no_cancelable',
    });
    expect(await vacio.cancelarClase({ idClase: '9' })).toMatchObject({
      error: true,
      code: 409,
    });
    const fijo = crearMemoriaClasesRepository([], {
      cancelacion: { estadoFinal: 'to_reschedule' },
    });
    expect((await fijo.cancelarClase({ idClase: '9' })).response).toEqual({
      estadoFinal: 'to_reschedule',
    });
  });
});
