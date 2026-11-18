import { fechaConDia, hora12 } from '@/shared/lib/fechas';

import type {
  IMensajeChat,
  IResponseMensaje,
} from '../domain/entities/Mensajes.entities';
import {
  ayerDe,
  horaDeMarca,
} from '../domain/validations/mensajes.validations';

/** Texto corto de un mensaje para la bandeja: su texto o qué adjuntó. */
const vistaPrevia = (m: IResponseMensaje): string => {
  if (m.texto.trim()) {
    return m.texto.trim();
  }
  if (m.tieneVoz) {
    return 'Nota de voz';
  }
  return m.tieneImagen ? 'Foto' : '';
};

const plural = (n: number, uno: string, varios: string) =>
  n === 1 ? `1 ${uno}` : `${n} ${varios}`;

/** Textos del chat (F3-01). */
export const textosMensajes = {
  titulo: 'Mensajes',
  tituloEstudiante: 'Tu profe',
  cargando: 'Cargando tus mensajes',
  error: { titulo: 'No pudimos cargar el chat', reintentar: 'Reintentar' },
  vacio: {
    estudiante: 'Todavía no hay mensajes. Escríbele a tu profe para empezar.',
    profe:
      'Todavía no hay mensajes con este estudiante. Escríbele para empezar.',
  },
  escribir: {
    etiqueta: 'Escribe un mensaje',
    placeholder: 'Escribe un mensaje…',
    enviar: 'Enviar mensaje',
  },
  volver: 'Volver a la bandeja',
  dia: {
    hoy: 'Hoy',
    ayer: 'Ayer',
    etiqueta: (fecha: string, hoy: string) =>
      fecha === hoy
        ? 'Hoy'
        : fecha === ayerDe(hoy)
        ? 'Ayer'
        : fechaConDia(fecha),
  },
  mensaje: {
    hora: (m: IMensajeChat) => hora12(horaDeMarca(m.creado)),
    estado: {
      enviando: 'Enviando…',
      enviado: 'Enviado',
      visto: 'Visto',
      fallido: 'No se envió',
    },
    reintentar: 'Reintentar',
    descartar: 'Descartar',
    reaccionarAyuda: 'Mantén pulsado para reaccionar',
    accesible: (m: IMensajeChat, autor: string, estado: string) =>
      [autor, m.texto, hora12(horaDeMarca(m.creado)), estado]
        .filter(Boolean)
        .join(', '),
    academia: 'Inglés con Sebas',
    foto: 'Foto',
    voz: 'Nota de voz',
    tu: 'Tú',
  },
  imagen: {
    cargando: 'Cargando foto…',
    reintentar: 'No se pudo cargar la foto. Toca para reintentar',
    abrir: 'Abrir la foto',
    cerrar: 'Cerrar',
  },
  adjuntar: {
    boton: 'Adjuntar una foto',
    titulo: 'Enviar una foto',
    galeria: 'Elegir de la galería',
    camara: 'Tomar una foto',
  },
  voz: {
    grabar: 'Grabar una nota de voz',
    grabando: 'Grabando',
    cancelar: 'Cancelar la grabación',
    enviar: 'Enviar la nota de voz',
    reproducir: 'Reproducir la nota de voz',
    detener: 'Detener la nota de voz',
    cargando: 'Cargando la nota de voz…',
    reintentar: 'No se pudo cargar la nota. Toca para reintentar',
  },
  reacciones: {
    titulo: 'Reaccionar',
    cerrar: 'Cerrar',
    ayuda: (emoji: string) => `Reaccionar con ${emoji}`,
    resumen: (emoji: string, n: number, mia: boolean) =>
      `${emoji} ${n}${mia ? ', tu reacción' : ''}`,
  },
  bandeja: {
    titulo: 'Mensajes',
    subtitulo: 'Tus estudiantes',
    vacio: 'Todavía no tienes estudiantes asignados.',
    sinMensajes: 'Sin mensajes todavía',
    noLeidos: (n: number) => plural(n, 'mensaje sin leer', 'mensajes sin leer'),
    vistaPrevia,
    tu: 'Tú: ',
    abrir: (nombre: string) => `Abrir el chat con ${nombre}`,
  },
} as const;
