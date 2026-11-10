/**
 * Textos compartidos de la interfaz (mensajes genéricos que usan shared/lib y los providers).
 * Los textos de cada pantalla viven en su propio archivo `*.textos.ts`.
 */
export const textosComunes = {
  errores: {
    red: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
    tiempoAgotado:
      'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
    respuestaInvalida: 'El servidor respondió con un formato inesperado.',
    noAutorizado: 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
    servidor: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
    desconocido: 'Ocurrió un error inesperado.',
  },
} as const;
