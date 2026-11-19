import {
  fechaConDia,
  fechaCorta,
  hora12,
  nombreDia,
  partesFecha,
} from '@/shared/lib/fechas';

import type {
  IClaseAgenda,
  IDiaSemana,
  MarcaAsistencia,
  MomentoClase,
} from '../domain/entities/Agenda.entities';

const MOMENTOS: Record<MomentoClase, string> = {
  proxima: 'Próxima',
  en_curso: 'En curso',
  por_marcar: 'Sin marcar',
  tomada: 'Realizada',
  no_asistio: 'No asistió',
};

const numeroDeClase = (n: number | null) => (n ? `Clase ${n}` : null);

const plural = (n: number, uno: string, varios: string) =>
  n === 1 ? `1 ${uno}` : `${n} ${varios}`;

/** Textos de la agenda del profe (F2-02). */
export const textosAgenda = {
  titulo: 'Clases',
  cargando: 'Cargando tu agenda',
  error: { titulo: 'No pudimos cargar tu agenda', reintentar: 'Reintentar' },
  vista: {
    dia: 'Día',
    semana: 'Semana',
    ayuda: (vista: 'dia' | 'semana') =>
      vista === 'dia'
        ? 'Ver el horario del día'
        : 'Ver el horario de la semana',
  },
  navegar: {
    anteriorDia: 'Ir al día anterior',
    siguienteDia: 'Ir al día siguiente',
    anteriorSemana: 'Ir a la semana anterior',
    siguienteSemana: 'Ir a la semana siguiente',
    hoy: 'Hoy',
    esHoy: 'Hoy',
    rangoSemana: (dias: readonly IDiaSemana[]) =>
      dias.length === 7
        ? `${fechaCorta(dias[0].fecha)} – ${fechaCorta(dias[6].fecha)}`
        : '',
    dia: (fecha: string) => fechaConDia(fecha),
  },
  dia: {
    vacio: 'No tienes clases este día.',
    total: (n: number) => plural(n, 'clase', 'clases'),
    momento: MOMENTOS,
    numero: numeroDeClase,
    abrirZoom: 'Abrir Zoom',
    abrirZoomAyuda: 'Abre tu sala de Zoom para esta clase',
    accesible: (c: IClaseAgenda) =>
      [
        hora12(c.hora),
        c.estudiante,
        numeroDeClase(c.numeroClase),
        MOMENTOS[c.momento],
      ]
        .filter(Boolean)
        .join(', '),
  },
  semana: {
    nombreDia: (fecha: string) => {
      const p = partesFecha(fecha);
      return p ? `${nombreDia(p.diaSemana)} ${p.dia}` : fecha;
    },
    clases: (n: number) =>
      n === 0 ? 'Sin clases' : plural(n, 'clase', 'clases'),
    sinMarcar: (n: number) => `${n} sin marcar`,
    accesible: (d: IDiaSemana) =>
      `${fechaConDia(d.fecha)}: ${
        d.total === 0 ? 'sin clases' : plural(d.total, 'clase', 'clases')
      }${d.sinMarcar ? `, ${d.sinMarcar} sin marcar` : ''}`,
    abrir: 'Ver este día',
  },
  anteriores: {
    titulo: 'Clases anteriores sin marcar',
    total: (n: number) => `${n} sin marcar`,
    detalle: (c: IClaseAgenda) => `${fechaCorta(c.fecha)} · ${hora12(c.hora)}`,
  },
  marcar: {
    realizada: 'Realizada',
    noAsistio: 'No asistió',
    ayuda: (estudiante: string, marca: MarcaAsistencia) =>
      marca === 'taken'
        ? `Marcar la clase de ${estudiante} como realizada`
        : `Marcar que ${estudiante} no asistió`,
    hoja: {
      titulo: (marca: MarcaAsistencia) =>
        marca === 'taken'
          ? '¿La clase se realizó?'
          : '¿El estudiante no asistió?',
      cuerpo: (c: IClaseAgenda, marca: MarcaAsistencia) =>
        marca === 'taken'
          ? `Vas a marcar la clase de ${c.estudiante} del ${fechaConDia(
              c.fecha,
            )} a las ${hora12(c.hora)} como realizada.`
          : `Vas a marcar que ${
              c.estudiante
            } no asistió a su clase del ${fechaConDia(c.fecha)} a las ${hora12(
              c.hora,
            )}. La clase cuenta como tomada.`,
      aviso:
        'Una vez marcada no se puede cambiar desde la App: si hubo un error, lo corrige la administración.',
      confirmar: (marca: MarcaAsistencia) =>
        marca === 'taken' ? 'Sí, realizada' : 'Sí, no asistió',
      volver: 'Volver',
      cerrar: 'Cerrar',
    },
  },
} as const;
