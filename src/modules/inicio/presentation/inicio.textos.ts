import type {
  CuentaAtras,
  ICancelaciones,
  ICicloEstudiante,
  IProgresoCiclo,
  IResponseMensaje,
} from '../domain/entities/Inicio.entities';
import {
  etiquetaDia,
  hoyBogota,
  partesFecha,
  partesHora,
  type EtiquetaDia,
} from '../domain/validations/inicio.validations';

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

/** «6:00 p. m.» a partir de `HH:mm`. Si no es una hora, la devuelve tal cual. */
export function hora12(hora: string): string {
  const h = partesHora(hora);
  if (!h) {
    return hora;
  }
  const sufijo = h.horas >= 12 ? 'p. m.' : 'a. m.';
  const doce = h.horas % 12 || 12;
  return `${doce}:${String(h.minutos).padStart(2, '0')} ${sufijo}`;
}

/** «15 nov». */
export function fechaCorta(fecha: string): string {
  const p = partesFecha(fecha);
  return p ? `${p.dia} ${MESES[p.mes - 1]}` : fecha;
}

/** «mar 29 sep». */
export function fechaConDia(fecha: string): string {
  const p = partesFecha(fecha);
  return p ? `${DIAS[p.diaSemana - 1]} ${p.dia} ${MESES[p.mes - 1]}` : fecha;
}

function textoDia(etiqueta: EtiquetaDia): string {
  if (etiqueta.tipo === 'hoy') {
    return 'Hoy';
  }
  if (etiqueta.tipo === 'manana') {
    return 'Mañana';
  }
  return `${DIAS[etiqueta.diaSemana - 1]} ${etiqueta.dia} ${
    MESES[etiqueta.mes - 1]
  }`;
}

/** Textos de la pantalla de inicio del estudiante (F1-05). */
export const textosInicio = {
  saludo: (nombre: string) => `Hola, ${nombre}`,
  /** «Plan Progress · ciclo 15 sep – 14 oct». `null` si no hay ni plan ni ciclo. */
  planYCiclo: (
    plan: string | null,
    ciclo: ICicloEstudiante | null,
  ): string | null => {
    const partes = [
      plan ? `Plan ${plan}` : null,
      ciclo
        ? `ciclo ${fechaCorta(ciclo.inicio)} – ${fechaCorta(ciclo.fin)}`
        : null,
    ].filter(Boolean);
    return partes.length ? partes.join(' · ') : null;
  },
  abrirCuenta: 'Abrir el menú de tu cuenta',
  cuenta: {
    titulo: 'Tu cuenta',
    cerrarSesion: 'Cerrar sesión',
    verSistemaDiseno: 'Ver sistema de diseño',
    cerrar: 'Cerrar el menú',
  },
  cargando: 'Cargando tu inicio',
  error: {
    titulo: 'No pudimos cargar tu inicio',
    seccion: 'No pudimos cargar esta sección',
    reintentar: 'Reintentar',
  },
  proximaClase: {
    etiqueta: 'Próxima clase',
    cuentaAtras: (c: CuentaAtras): string => {
      switch (c.tipo) {
        case 'ahora':
          return 'Ahora';
        case 'minutos':
          return `En ${c.valor} min`;
        case 'horas':
          return `En ${c.valor} h`;
        case 'dias':
          return c.valor === 1 ? 'En 1 día' : `En ${c.valor} días`;
      }
    },
    cuando: (fecha: string, hora: string, ahoraMs: number): string => {
      const dia = etiquetaDia(fecha, ahoraMs);
      return dia ? `${textoDia(dia)} · ${hora12(hora)}` : hora12(hora);
    },
    detalle: (
      profe: string | null,
      duracionMin: number | null,
      zoom: boolean,
    ): string | null => {
      const partes = [
        profe ? `Con ${profe}` : null,
        duracionMin ? `${duracionMin} min` : null,
        zoom ? 'por Zoom' : null,
      ].filter(Boolean);
      return partes.length ? partes.join(' · ') : null;
    },
    reagendada: 'Reagendada',
    irAMiClase: 'Ir a mi clase',
    irAMiClaseAyuda: 'Abre el enlace de Zoom de tu clase',
    sinEnlace: '¿No encuentras el link de tu clase? Escríbele a tu profe.',
    reagendar: 'Reagendar',
    vacioTitulo: 'Aún no tienes clases programadas',
    vacioMensaje: 'Cuando tengas tu próxima clase, la verás aquí.',
  },
  ciclo: {
    etiqueta: 'Ciclo',
    progreso: (p: IProgresoCiclo) =>
      p.total === null
        ? `${p.tomadas} ${p.tomadas === 1 ? 'clase tomada' : 'clases tomadas'}`
        : `${p.tomadas} de ${p.total} clases`,
    accesible: (p: IProgresoCiclo) =>
      p.total === null
        ? `Ciclo: ${p.tomadas} clases tomadas`
        : `Ciclo: ${p.tomadas} de ${p.total} clases tomadas`,
  },
  cancelaciones: {
    etiqueta: 'Cancelaciones',
    disponibles: (c: ICancelaciones) => `${c.disponibles} de ${c.maximas}`,
    aviso: (c: ICancelaciones) => `Avisa con ${c.horasAviso} h de antelación`,
    sinCancelaciones: 'Tu plan no incluye cancelaciones',
    accesible: (c: ICancelaciones) =>
      `Cancelaciones: te quedan ${c.disponibles} de ${c.maximas}`,
  },
  tareas: {
    titulo: 'Tareas pendientes',
    porEntregar: (n: number) => `${n} por entregar`,
    vence: (
      venceEl: string | null,
      estado: 'vencida' | 'hoy' | 'futura' | null,
    ): string | null => {
      if (!venceEl || !estado) {
        return null;
      }
      if (estado === 'hoy') {
        return 'Vence hoy';
      }
      return `${estado === 'vencida' ? 'Venció' : 'Vence'} ${fechaConDia(
        venceEl,
      )}`;
    },
    sinTitulo: 'Tarea sin título',
    vacio: 'Aún no tienes tareas pendientes',
    abrir: (titulo: string) => `Tarea: ${titulo}`,
  },
  mensajes: {
    titulo: 'Mensajes',
    sinLeer: (n: number) => `${n} sin leer`,
    tu: 'Tú',
    academia: 'Inglés con Sebas',
    imagen: 'Imagen',
    voz: 'Nota de voz',
    vacio: 'Aún no tienes mensajes',
    /** La otra parte de la conversación: si el último lo envió el estudiante, es la academia. */
    remitente: (m: IResponseMensaje) =>
      m.deEstudiante ? 'Inglés con Sebas' : m.remitente || 'Inglés con Sebas',
    contenido: (m: IResponseMensaje) => {
      const cuerpo = m.texto
        ? m.texto
        : m.adjunto === 'voz'
        ? 'Nota de voz'
        : 'Imagen';
      return m.deEstudiante ? `Tú: ${cuerpo}` : cuerpo;
    },
    /** Hora si es de hoy; si no, la fecha. */
    cuando: (enviadoEl: string, ahoraMs: number) => {
      const fecha = enviadoEl.slice(0, 10);
      if (!partesFecha(fecha)) {
        return '';
      }
      return fecha === hoyBogota(ahoraMs)
        ? hora12(enviadoEl.slice(11, 16))
        : fechaCorta(fecha);
    },
    abrir: (remitente: string, noLeidos: number | null) =>
      noLeidos
        ? `Último mensaje de ${remitente}, ${noLeidos} sin leer`
        : `Último mensaje de ${remitente}`,
  },
} as const;
