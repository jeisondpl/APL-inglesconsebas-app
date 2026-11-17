// F1-05: cálculos puros del inicio (CA9-CA12) con un instante fijo y la hora de Bogotá (UTC−5).
import type {
  IResponseFranjaHorario,
  IResponseMensaje,
  IResponseSesionClase,
  IResponseTarea,
} from '@/modules/inicio/domain/entities/Inicio.entities';
import { REGLAS_PLAN } from '@/modules/inicio/domain/inicio.reglas';
import {
  cancelacionesDisponibles,
  cuentaAtras,
  duracionDeFranja,
  estadoVencimiento,
  etiquetaDia,
  horasDeAviso,
  hoyBogota,
  inicialDe,
  nombreDePila,
  instanteBogota,
  nombrePlan,
  partesFecha,
  partesHora,
  progresoCiclo,
  proximaClase,
  tareasPendientes,
  ultimoMensaje,
} from '@/modules/inicio/domain/validations/inicio.validations';

/** Martes 17 nov 2026, 10:00 en Bogotá (15:00 UTC). */
const AHORA = Date.UTC(2026, 10, 17, 15, 0);
const MIN = 60 * 1000;
const HORA = 60 * MIN;

const sesion = (
  parcial: Partial<IResponseSesionClase> = {},
): IResponseSesionClase => ({
  id: '1',
  fecha: '2026-11-18',
  hora: '18:00',
  estado: 'scheduled',
  cuentaComoTomada: false,
  inicioCiclo: '2026-11-15',
  finCiclo: '2026-12-14',
  fechaNueva: null,
  horaNueva: null,
  profe: 'Meli',
  enlaceZoom: 'https://zoom.us/j/1',
  ...parcial,
});

describe('partesFecha y partesHora', () => {
  it('descompone fechas con su día ISO y rechaza lo que no es fecha', () => {
    expect(partesFecha('2026-11-17')).toEqual({
      anio: 2026,
      mes: 11,
      dia: 17,
      diaSemana: 2,
    });
    expect(partesFecha('2026-11-22')?.diaSemana).toBe(7);
    expect(partesFecha('2026-11-17 08:00:00')?.dia).toBe(17);
    expect(partesFecha('ayer')).toBeNull();
    expect(partesFecha(null)).toBeNull();
    expect(partesFecha(undefined)).toBeNull();
  });

  it('descompone horas con o sin segundos y rechaza las inválidas', () => {
    expect(partesHora('18:05')).toEqual({ horas: 18, minutos: 5 });
    expect(partesHora('7:30:00')).toEqual({ horas: 7, minutos: 30 });
    expect(partesHora('25:00')).toBeNull();
    expect(partesHora('10:75')).toBeNull();
    expect(partesHora('')).toBeNull();
    expect(partesHora(null)).toBeNull();
  });
});

describe('instanteBogota y hoyBogota', () => {
  it('convierte la hora de Bogotá a UTC (+5 h)', () => {
    expect(instanteBogota('2026-11-17', '10:00')).toBe(AHORA);
    expect(instanteBogota('2026-11-17', 'nada')).toBeNull();
    expect(instanteBogota('x', '10:00')).toBeNull();
  });

  it('el día de hoy es el de Bogotá, no el de UTC', () => {
    // 02:00 UTC del 18 = 21:00 del 17 en Bogotá.
    expect(hoyBogota(Date.UTC(2026, 10, 18, 2, 0))).toBe('2026-11-17');
    expect(hoyBogota(AHORA)).toBe('2026-11-17');
  });
});

describe('duracionDeFranja', () => {
  const horario: IResponseFranjaHorario[] = [
    { diaSemana: 3, hora: '18:00', duracionMin: 50 },
    { diaSemana: 1, hora: '7:00', duracionMin: null },
  ];
  it('busca la franja por día de la semana y hora', () => {
    expect(duracionDeFranja(horario, '2026-11-18', '18:00:00')).toBe(50);
    expect(duracionDeFranja(horario, '2026-11-23', '07:00')).toBeNull();
    expect(duracionDeFranja(horario, '2026-11-19', '18:00')).toBeNull();
    expect(duracionDeFranja([], '2026-11-18', '18:00')).toBeNull();
  });
});

describe('proximaClase (CA9)', () => {
  const horario: IResponseFranjaHorario[] = [
    { diaSemana: 3, hora: '18:00', duracionMin: 50 },
  ];

  it('elige la scheduled futura más cercana y le pone la duración del horario', () => {
    const r = proximaClase(
      [
        sesion({ id: 'lejos', fecha: '2026-11-25' }),
        sesion({ id: 'cerca', fecha: '2026-11-18' }),
        sesion({ id: 'tomada', fecha: '2026-11-17', estado: 'taken' }),
      ],
      horario,
      AHORA,
    );
    expect(r).toMatchObject({
      id: 'cerca',
      fecha: '2026-11-18',
      hora: '18:00',
      profe: 'Meli',
      duracionMin: 50,
      reagendada: false,
      inicioMs: AHORA + 32 * HORA,
    });
  });

  it('una reagendada cuenta en su fecha y hora nuevas', () => {
    const r = proximaClase(
      [
        sesion({ id: 'normal', fecha: '2026-11-20' }),
        sesion({
          id: 'reag',
          estado: 'rescheduled',
          fecha: '2026-11-10',
          fechaNueva: '2026-11-17',
          horaNueva: '15:30:00',
        }),
      ],
      [],
      AHORA,
    );
    expect(r).toMatchObject({
      id: 'reag',
      fecha: '2026-11-17',
      hora: '15:30',
      reagendada: true,
      duracionMin: null,
    });
  });

  it('una reagendada sin hora nueva conserva la original; sin fecha nueva se ignora', () => {
    expect(
      proximaClase(
        [
          sesion({
            estado: 'rescheduled',
            fechaNueva: '2026-11-19',
            horaNueva: null,
          }),
        ],
        [],
        AHORA,
      )?.hora,
    ).toBe('18:00');
    expect(
      proximaClase(
        [sesion({ estado: 'rescheduled', fechaNueva: null })],
        [],
        AHORA,
      ),
    ).toBeNull();
  });

  it('sigue siendo la próxima hasta 50 min después de empezar', () => {
    const enCurso = sesion({ fecha: '2026-11-17', hora: '09:20' });
    expect(proximaClase([enCurso], [], AHORA)?.id).toBe('1');
    const terminada = sesion({ fecha: '2026-11-17', hora: '09:10' });
    expect(proximaClase([terminada], [], AHORA)).toBeNull();
  });

  it('sin clases futuras, o con fechas inválidas, no hay próxima', () => {
    expect(proximaClase([], [], AHORA)).toBeNull();
    expect(
      proximaClase([sesion({ fecha: '2026-11-01' })], [], AHORA),
    ).toBeNull();
    expect(proximaClase([sesion({ hora: '' })], [], AHORA)).toBeNull();
  });
});

describe('cuentaAtras (CA9)', () => {
  it.each([
    [-5 * MIN, { tipo: 'ahora' }],
    [0, { tipo: 'ahora' }],
    [30 * 1000, { tipo: 'minutos', valor: 1 }],
    [35 * MIN, { tipo: 'minutos', valor: 35 }],
    [HORA, { tipo: 'horas', valor: 1 }],
    [21 * HORA + 40 * MIN, { tipo: 'horas', valor: 21 }],
    [24 * HORA, { tipo: 'dias', valor: 1 }],
    [3 * 24 * HORA + 5 * HORA, { tipo: 'dias', valor: 3 }],
  ])('falta %p ms → %p', (falta, esperado) => {
    expect(cuentaAtras(AHORA + falta, AHORA)).toEqual(esperado);
  });
});

describe('etiquetaDia', () => {
  it('hoy, mañana o la fecha', () => {
    expect(etiquetaDia('2026-11-17', AHORA)).toEqual({ tipo: 'hoy' });
    expect(etiquetaDia('2026-11-18', AHORA)).toEqual({ tipo: 'manana' });
    expect(etiquetaDia('2026-11-24', AHORA)).toEqual({
      tipo: 'fecha',
      anio: 2026,
      mes: 11,
      dia: 24,
      diaSemana: 2,
    });
    expect(etiquetaDia('no', AHORA)).toBeNull();
  });
});

describe('nombrePlan y horasDeAviso', () => {
  it('quita el emoji de los planes conocidos y deja el resto tal cual', () => {
    expect(nombrePlan('Progress')).toBe('Progress');
    expect(nombrePlan('Power⚡')).toBe('Power');
    expect(nombrePlan('Flex8🎯')).toBe('Essential-Flex');
    expect(nombrePlan('Especial')).toBe('Especial');
    expect(nombrePlan(null)).toBeNull();
  });

  it('24 h en Flex y 12 h en el resto (CA10)', () => {
    expect(horasDeAviso('Flex12🎯')).toBe(24);
    expect(horasDeAviso('FlexNuevo')).toBe(24);
    expect(horasDeAviso('Power⚡')).toBe(12);
    expect(horasDeAviso('Essential')).toBe(12);
    expect(horasDeAviso(null)).toBe(12);
  });

  it('el espejo de PLAN_RULES tiene los once planes de la web', () => {
    expect(Object.keys(REGLAS_PLAN)).toHaveLength(11);
    expect(REGLAS_PLAN.Essential.minimo).toBe(8);
  });
});

describe('progresoCiclo (CA10)', () => {
  const delCiclo = [
    sesion({ id: 'a', estado: 'taken', cuentaComoTomada: true }),
    sesion({ id: 'b', estado: 'no_show', cuentaComoTomada: true }),
    sesion({ id: 'c', estado: 'scheduled' }),
    sesion({
      id: 'd',
      estado: 'holiday_no_impact',
      cuentaComoTomada: true,
    }),
    sesion({ id: 'e', estado: 'cancelled_no_impact' }),
    // De otro ciclo: no cuenta.
    sesion({
      id: 'f',
      estado: 'taken',
      cuentaComoTomada: true,
      inicioCiclo: '2026-10-15',
      finCiclo: '2026-11-14',
    }),
    sesion({ id: 'g', inicioCiclo: null, finCiclo: null }),
  ];

  it('tomadas del ciclo de hoy sobre el mínimo del plan', () => {
    expect(progresoCiclo(delCiclo, 'Progress', AHORA)).toEqual({
      tomadas: 2,
      total: 12,
      fraccion: 2 / 12,
    });
  });

  it('en Power el total son las sesiones del ciclo sin las no_impact', () => {
    expect(progresoCiclo(delCiclo, 'Power⚡', AHORA)).toEqual({
      tomadas: 2,
      total: 3,
      fraccion: 2 / 3,
    });
  });

  it('con un plan desconocido o sin plan no inventa el total', () => {
    expect(progresoCiclo(delCiclo, 'Otro', AHORA)).toEqual({
      tomadas: 2,
      total: null,
      fraccion: 0,
    });
    expect(progresoCiclo([], null, AHORA).total).toBeNull();
  });

  it('la fracción no pasa de 1', () => {
    const muchas = Array.from({ length: 6 }, (_, i) =>
      sesion({ id: String(i), estado: 'taken', cuentaComoTomada: true }),
    );
    expect(progresoCiclo(muchas, 'Starter', AHORA).fraccion).toBe(1);
  });
});

describe('cancelacionesDisponibles (CA10)', () => {
  it('máximo menos usadas, sin negativos ni por encima del máximo', () => {
    const base = { plan: 'Progress', ciclo: null };
    expect(
      cancelacionesDisponibles({
        ...base,
        cancelacionesUsadas: 1,
        cancelacionesMaximas: 3,
      }),
    ).toEqual({ disponibles: 2, maximas: 3, horasAviso: 12 });
    expect(
      cancelacionesDisponibles({
        ...base,
        cancelacionesUsadas: 5,
        cancelacionesMaximas: 3,
      }).disponibles,
    ).toBe(0);
    expect(
      cancelacionesDisponibles({
        ...base,
        cancelacionesUsadas: -2,
        cancelacionesMaximas: 3,
      }).disponibles,
    ).toBe(3);
    expect(
      cancelacionesDisponibles({
        plan: 'Flex8🎯',
        ciclo: null,
        cancelacionesUsadas: 0,
        cancelacionesMaximas: -1,
      }),
    ).toEqual({ disponibles: 0, maximas: 0, horasAviso: 24 });
  });
});

describe('tareasPendientes (CA11)', () => {
  const tarea = (
    id: string,
    estado: string,
    venceEl: string | null,
  ): IResponseTarea => ({ id, titulo: `T${id}`, estado, venceEl });

  it('solo pending, las que vencen antes primero (sin fecha al final), hasta 3', () => {
    const r = tareasPendientes([
      tarea('1', 'pending', null),
      tarea('2', 'pending', '2026-11-20'),
      tarea('3', 'reviewed', '2026-11-01'),
      tarea('4', 'pending', '2026-11-18'),
      tarea('5', 'pending', '2026-11-18'),
      tarea('6', 'pending', null),
    ]);
    expect(r.total).toBe(5);
    expect(r.lista.map(t => t.id)).toEqual(['4', '5', '2']);
  });

  it('sin pendientes devuelve una lista vacía', () => {
    expect(tareasPendientes([tarea('1', 'reviewed', null)])).toEqual({
      lista: [],
      total: 0,
    });
  });

  it('ordena también cuando la primera no tiene fecha', () => {
    const r = tareasPendientes([
      tarea('a', 'pending', null),
      tarea('b', 'pending', '2026-11-30'),
    ]);
    expect(r.lista.map(t => t.id)).toEqual(['b', 'a']);
  });
});

describe('estadoVencimiento', () => {
  it('vencida, hoy, futura o sin fecha', () => {
    expect(estadoVencimiento('2026-11-10', AHORA)).toBe('vencida');
    expect(estadoVencimiento('2026-11-17', AHORA)).toBe('hoy');
    expect(estadoVencimiento('2026-11-29', AHORA)).toBe('futura');
    expect(estadoVencimiento(null, AHORA)).toBeNull();
    expect(estadoVencimiento('pronto', AHORA)).toBeNull();
  });
});

describe('ultimoMensaje (CA12) e inicialDe', () => {
  const mensaje = (id: string, enviadoEl: string): IResponseMensaje => ({
    id,
    remitente: 'Meli',
    deEstudiante: false,
    texto: 'hola',
    adjunto: null,
    enviadoEl,
  });

  it('el más reciente por fecha (con empate, el último del hilo)', () => {
    expect(ultimoMensaje([])).toBeNull();
    expect(
      ultimoMensaje([
        mensaje('1', '2026-11-10 11:49:17'),
        mensaje('2', '2026-11-12 08:00:00'),
        mensaje('3', '2026-11-11 08:00:00'),
      ])?.id,
    ).toBe('2');
    expect(
      ultimoMensaje([
        mensaje('1', '2026-11-10 11:49:17'),
        mensaje('2', '2026-11-10 11:49:17'),
      ])?.id,
    ).toBe('2');
  });

  it('inicial en mayúscula o «?»', () => {
    expect(inicialDe(' ana Torres')).toBe('A');
    expect(inicialDe('élida')).toBe('É');
    expect(inicialDe('')).toBe('?');
    expect(nombreDePila('  Ana Torres ')).toBe('Ana');
    expect(nombreDePila('María José Pérez')).toBe('María');
    expect(nombreDePila(null)).toBe('');
    expect(inicialDe(null)).toBe('?');
  });
});
