import type {
  IClaseHoy,
  MomentoClase,
} from '../domain/entities/InicioProfe.entities';
import { fechaConDia, fechaCorta, hora12 } from './inicio.textos';

const MOMENTOS: Record<MomentoClase, string> = {
  proxima: 'Próxima',
  en_curso: 'En curso',
  por_marcar: 'Sin marcar',
  // Igual que en la agenda (agenda.textos.ts), donde se marca «Realizada».
  tomada: 'Realizada',
  no_asistio: 'No asistió',
};

const numeroDeClase = (n: number | null) => (n ? `Clase ${n}` : null);

/** Textos del inicio del profe (F1-07). Comparte formato de fechas con el del estudiante. */
export const textosInicioProfe = {
  /** «Profe · mar 17 nov». */
  subtitulo: (hoy: string) => `Profe · ${fechaConDia(hoy)}`,
  cargando: 'Cargando tus clases',
  error: {
    titulo: 'No pudimos cargar tu inicio',
    seccion: 'No pudimos cargar esta sección',
    reintentar: 'Reintentar',
  },
  hoy: {
    titulo: 'Clases de hoy',
    total: (n: number) => (n === 1 ? '1 clase' : `${n} clases`),
    vacio: 'Hoy no tienes clases programadas.',
    momento: MOMENTOS,
    numero: numeroDeClase,
    accesible: (c: IClaseHoy) =>
      [
        hora12(c.hora),
        c.estudiante,
        numeroDeClase(c.numeroClase),
        MOMENTOS[c.momento],
      ]
        .filter(Boolean)
        .join(', '),
  },
  destacada: {
    ahora: 'Clase en curso',
    siguiente: 'Tu siguiente clase',
    abrirZoom: 'Abrir Zoom',
    abrirZoomAyuda: 'Abre tu sala de Zoom para esta clase',
    sinEnlace: 'Esta clase no tiene enlace de Zoom en Leap.',
    hora: (hora: string) => hora12(hora),
  },
  asistencias: {
    titulo: 'Asistencias por marcar',
    total: (n: number) => `${n} sin marcar`,
    vacio: 'Tienes todas las asistencias al día.',
    detalle: (fecha: string, hora: string) =>
      `${fechaCorta(fecha)} · ${hora12(hora)}`,
    marcar: 'Marcar',
    marcarAccesible: (estudiante: string) =>
      `Marcar la asistencia de ${estudiante}`,
    mas: (n: number) => (n === 1 ? 'Y 1 más' : `Y ${n} más`),
  },
  revisar: {
    titulo: 'Tareas por revisar',
    total: (n: number) => `${n} por revisar`,
    vacio: 'No tienes tareas esperando revisión.',
    sinTitulo: 'Tarea sin título',
    abrir: (titulo: string, estudiante: string) =>
      estudiante ? `Revisar ${titulo}, de ${estudiante}` : `Revisar ${titulo}`,
  },
  mensajes: {
    titulo: 'Mensajes',
    sinLeer: (n: number) =>
      n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`,
    alDia: 'No tienes mensajes sin leer.',
    abrir: 'Ir a mensajes',
  },
} as const;
