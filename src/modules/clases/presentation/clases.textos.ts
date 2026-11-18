import {
  fechaConDia,
  fechaCorta,
  hora12,
  nombreDia,
  nombreMes,
  partesFecha,
} from '@/shared/lib/fechas';

import type {
  EscenarioCancelacion,
  ICicloClases,
  IClaseHistorial,
  OpcionCancelacion,
  VistaPreviaCancelacion,
} from '../domain/entities/Clases.entities';

/** «15 oct – 14 nov», o «Clases sin ciclo» si Leap no dio las fechas. */
const rangoCiclo = (c: ICicloClases): string =>
  c.inicio && c.fin
    ? `${fechaCorta(c.inicio)} – ${fechaCorta(c.fin)}`
    : 'Sin ciclo';

type VistaCancelable = Extract<VistaPreviaCancelacion, { puede: true }>;

/** «mar 18 nov a las 6:00 p. m.». */
const cuando = (v: VistaCancelable) =>
  `${fechaConDia(v.fecha)} a las ${hora12(v.hora)}`;

/** Tokens que quedarían después de gastar uno. */
const quedarian = (v: VistaCancelable) =>
  Math.max(0, v.tokensMaximos - v.tokensUsados - 1);

const PRONTO_AGENDAR =
  'Agendar otra clase desde la App llegará pronto; por ahora hazlo desde la web.';
const PRONTO_ESCOGER =
  'Escoger el nuevo espacio desde la App llegará pronto; por ahora, desde la web.';

export interface ITextoEscenario {
  titulo: string;
  cuerpo: string;
  confirmar: string;
  /** peligro: la clase queda como tomada o se descuenta; primario: no tiene costo malo. */
  tono: 'primario' | 'peligro';
}

/** Lo que dice la hoja de cancelar para cada escenario que decide Leap. */
const ESCENARIOS_CANCELAR: Record<
  EscenarioCancelacion,
  (v: VistaCancelable) => ITextoEscenario
> = {
  flex_libera: v => ({
    titulo: 'Liberar tu clase',
    cuerpo: `Vas a liberar tu clase del ${cuando(
      v,
    )}. Como avisas con más de 24 horas, recuperas el cupo. ${PRONTO_AGENDAR}`,
    confirmar: 'Sí, liberar la clase',
    tono: 'primario',
  }),
  flex_tarde: v => ({
    titulo: 'Cancelación con menos de 24 horas',
    cuerpo: `Tu clase del ${cuando(
      v,
    )} empieza en menos de 24 horas. Si la cancelas ahora, se descuenta de tu plan y no podrás agendar otra en su lugar. Tu profe ya se preparó para esta sesión.`,
    confirmar: 'Sí, cancelar',
    tono: 'peligro',
  }),
  power_tarde: v => ({
    titulo: 'Cancelación tardía',
    cuerpo: `Tu clase del ${cuando(
      v,
    )} empieza en menos de 12 horas y quedará registrada como tomada.${
      v.descuentaToken
        ? ` Se usará 1 cancelación (te quedan ${quedarian(v)}).`
        : ''
    }`,
    confirmar: 'Sí, cancelar',
    tono: 'peligro',
  }),
  power_elige: v => ({
    titulo: '¿Qué quieres hacer con esta clase?',
    cuerpo: `Tu clase es el ${cuando(
      v,
    )}. Se usará 1 cancelación de tu plan Power (te quedan ${quedarian(
      v,
    )} después) en cualquiera de las dos opciones.`,
    confirmar: 'Sí, cancelar',
    tono: 'primario',
  }),
  elige: v => ({
    titulo: '¿Qué quieres hacer con esta clase?',
    cuerpo: `Esta clase no afecta tu mínimo de ${
      v.minimo
    } clases: aunque la canceles, tu ciclo queda completo. Puedes soltarla, o moverla gastando 1 token (te quedarían ${quedarian(
      v,
    )}).`,
    confirmar: 'Sí, cancelar',
    tono: 'primario',
  }),
  reagendar_necesario: v => ({
    titulo: 'Cancelar y reagendar',
    cuerpo: `Al cancelar esta clase estarías por debajo de tu mínimo de ${
      v.minimo
    } clases del ciclo. Se usará 1 token (te quedarán ${quedarian(
      v,
    )}) y tendrás 1 mes desde la fecha original para escoger un nuevo espacio. ${PRONTO_ESCOGER}`,
    confirmar: 'Sí, cancelar y reagendar',
    tono: 'primario',
  }),
  sin_tokens: () => ({
    titulo: 'Sin cancelaciones disponibles',
    cuerpo:
      'Ya usaste todos tus tokens de movimiento de este ciclo, así que esta clase no se puede reagendar. Si la cancelas quedará registrada como tomada. Los tokens se restablecen al inicio de tu próximo ciclo.',
    confirmar: 'Sí, cancelar de todas formas',
    tono: 'peligro',
  }),
  reagendada: v => ({
    titulo: '¿Cancelar la clase reagendada?',
    cuerpo: `Esta clase fue reagendada para el ${cuando(
      v,
    )}. Si la cancelas contará como tomada y no podrás moverla de nuevo.`,
    confirmar: 'Sí, cancelar',
    tono: 'peligro',
  }),
};

const MOTIVOS_NO_CANCELABLE: Record<string, string> = {
  no_cancelable: 'Esta clase ya no se puede cancelar.',
  ya_empezo: 'Esta clase ya empezó, así que ya no se puede cancelar ni mover.',
  ciclo_futuro: 'Esta clase es de un ciclo que todavía no empieza.',
  fecha_invalida: 'Esta clase no tiene una fecha válida.',
};

/** Textos de Clases del estudiante (F2-01, 2.1 y 2.2). */
export const textosClases = {
  titulo: 'Clases',
  cargando: 'Cargando tus clases',
  error: {
    titulo: 'No pudimos cargar tus clases',
    reintentar: 'Reintentar',
  },
  vacio: {
    titulo: 'Aún no tienes clases',
    mensaje: 'Cuando tengas clases en tu ciclo, las verás aquí con su estado.',
  },
  ciclo: {
    etiqueta: (c: ICicloClases) => (c.esActual ? 'Ciclo actual' : 'Ciclo'),
    rango: rangoCiclo,
    anterior: 'Ver el ciclo anterior',
    siguiente: 'Ver el ciclo siguiente',
    accesible: (c: ICicloClases, posicion: number, total: number) =>
      `${c.esActual ? 'Ciclo actual' : 'Ciclo'} ${rangoCiclo(c)}, ${
        posicion + 1
      } de ${total}`,
  },
  resumen: {
    tomadas: 'Tomadas',
    programadas: 'Programadas',
    porReagendar: 'Por reagendar',
    canceladas: 'Canceladas',
  },
  vacioCiclo: 'Este ciclo no tiene clases.',
  cancelar: {
    boton: 'Cancelar clase',
    botonAyuda: (c: IClaseHistorial) =>
      `Cancelar la clase del ${fechaConDia(c.fecha)}`,
    revisando: 'Revisando tu clase',
    noSePuede: 'No se puede cancelar',
    entendido: 'Entendido',
    volver: 'Volver',
    cerrar: 'Cerrar',
    enGrupo: 'Estás en grupo: esta cancelación también afecta a tu compañero.',
    escenario: (v: VistaCancelable): ITextoEscenario =>
      ESCENARIOS_CANCELAR[v.escenario](v),
    motivo: (motivo: string): string =>
      MOTIVOS_NO_CANCELABLE[motivo] ?? MOTIVOS_NO_CANCELABLE.no_cancelable,
    opcion: (
      opcion: OpcionCancelacion,
      descuentaToken: boolean,
    ): { titulo: string; detalle: string } =>
      opcion === 'reagendar'
        ? {
            titulo: 'Reagendar después',
            detalle: 'Gasta 1 token y tienes 1 mes para escoger otro espacio.',
          }
        : {
            titulo: 'Soltarla',
            detalle: descuentaToken
              ? 'Gasta 1 cancelación y no se recupera.'
              : 'No gasta tokens.',
          },
  },
  clase: {
    proxima: 'Próxima',
    numero: (n: number | null) => (n ? `Clase ${n}` : null),
    /** «Clase 5 · con Meli · antes lun 16 nov». */
    detalle: (c: IClaseHistorial): string | null => {
      const partes = [
        textosClases.clase.numero(c.numeroClase),
        c.profe ? `con ${c.profe}` : null,
        c.fechaOriginal ? `antes ${fechaConDia(c.fechaOriginal)}` : null,
      ].filter(Boolean);
      return partes.length ? partes.join(' · ') : null;
    },
    /** Día de la semana y número: «mar 17». */
    dia: (fecha: string) => {
      const p = partesFecha(fecha);
      return p ? `${nombreDia(p.diaSemana)} ${p.dia}` : fecha;
    },
    mes: (fecha: string) => {
      const p = partesFecha(fecha);
      return p ? nombreMes(p.mes) : '';
    },
    hora: (hora: string) => (hora ? hora12(hora) : 'Sin hora'),
    abrirZoom: 'Ir a mi clase',
    abrirZoomAyuda: 'Abre el enlace de Zoom de tu clase',
    accesible: (c: IClaseHistorial, estado: string) =>
      `${fechaConDia(c.fecha)}, ${hora12(c.hora)}, ${estado}`,
  },
} as const;
