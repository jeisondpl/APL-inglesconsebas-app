import {
  fechaConDia,
  fechaCorta,
  hora12,
  nombreDia,
  nombreMes,
  partesFecha,
} from '@/shared/lib/fechas';

import type {
  ICicloClases,
  IClaseHistorial,
} from '../domain/entities/Clases.entities';

/** «15 oct – 14 nov», o «Clases sin ciclo» si Leap no dio las fechas. */
const rangoCiclo = (c: ICicloClases): string =>
  c.inicio && c.fin
    ? `${fechaCorta(c.inicio)} – ${fechaCorta(c.fin)}`
    : 'Sin ciclo';

/** Textos de Clases del estudiante (F2-01, 2.1). */
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
