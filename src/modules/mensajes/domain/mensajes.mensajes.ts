/** Mensajes de error del chat que nacen en el dominio (el servidor trae los suyos). */
export const mensajesChat = {
  textoVacio: 'Escribe un mensaje.',
  textoLargo: (max: number) =>
    `El mensaje es muy largo (máximo ${max} caracteres).`,
  sinEstudiante: 'No se sabe con quién es este chat.',
  sinMensaje: 'No se sabe de qué mensaje es.',
  imagenGrande: 'La foto es demasiado grande para enviarla.',
  sinMicrofono:
    'Para enviar notas de voz, permite el micrófono en los ajustes.',
  vozGrande: 'La nota de voz es demasiado larga para enviarla.',
  vozCorta: 'Mantén la grabación un poco más para enviarla.',
  noSePudoGrabar: 'No pudimos grabar',
  noSePudoReproducir: 'No pudimos reproducir la nota',
  noSePudoFoto: 'No pudimos abrir la foto',
  reaccionInvalida: 'Esa reacción no está permitida.',
  noSeEnvio: 'No se envió el mensaje',
  noSeActualizo: 'No pudimos actualizar el chat',
} as const;
