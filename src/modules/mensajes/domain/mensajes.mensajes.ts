/** Mensajes de error del chat que nacen en el dominio (el servidor trae los suyos). */
export const mensajesChat = {
  textoVacio: 'Escribe un mensaje.',
  textoLargo: (max: number) =>
    `El mensaje es muy largo (máximo ${max} caracteres).`,
  sinEstudiante: 'No se sabe con quién es este chat.',
  reaccionInvalida: 'Esa reacción no está permitida.',
  noSeEnvio: 'No se envió el mensaje',
  noSeActualizo: 'No pudimos actualizar el chat',
} as const;
