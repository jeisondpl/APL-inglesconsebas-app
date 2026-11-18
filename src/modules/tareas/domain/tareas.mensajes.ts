/** Mensajes de error de las tareas que nacen en el dominio (el servidor trae los suyos). */
export const mensajesTareas = {
  sinTarea: 'No se sabe de qué tarea es.',
  respuestaVacia: 'Escribe tu respuesta o graba un audio.',
  respuestaLarga: (max: number) =>
    `La respuesta es muy larga (máximo ${max} caracteres).`,
  feedbackVacio: 'Escribe un comentario, una nota o graba un audio.',
  comentarioLargo: (max: number) =>
    `El comentario es muy largo (máximo ${max} caracteres).`,
  notaLarga: (max: number) =>
    `La nota es muy larga (máximo ${max} caracteres).`,
  vozGrande: 'El audio es demasiado largo para enviarlo.',
  vozCorta: 'Mantén la grabación un poco más.',
  sinMicrofono: 'Para grabar, permite el micrófono en los ajustes.',
  noSePudoGrabar: 'No pudimos grabar',
  noSePudoReproducir: 'No pudimos reproducir el audio',
  noSeEnvio: 'No se envió',
  entregaEnviada: 'Entrega enviada',
  feedbackEnviado: 'Feedback enviado',
} as const;
