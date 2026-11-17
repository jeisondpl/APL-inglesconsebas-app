/** Textos de la bienvenida (lienzo A-O1…O4). El título de O1 es la opción 1 del brief (P1). */
export const textosOnboarding = {
  paginas: {
    bienvenida: {
      titulo: 'Tu inglés, en un solo lugar',
      descripcion:
        'Clases, tareas y mensajes de Inglés con Sebas, ahora en tu teléfono.',
    },
    clases: {
      titulo: 'Tus clases, bajo control',
      descripcion:
        'Consulta tu próxima clase y cancela o reagenda desde el teléfono, sin enredos.',
    },
    mensajes: {
      titulo: 'Habla con tu profe',
      descripcion:
        'Chatea con tu profe y envíale notas de voz e imágenes cuando quieras.',
    },
    tareas: {
      titulo: 'Tareas con feedback real',
      descripcion:
        'Entrega tus Extra Tasks en la app y recibe el feedback de tu profe.',
    },
  },
  siguiente: 'Siguiente',
  comenzar: 'Comenzar',
  omitir: 'Omitir',
  omitirEtiqueta: 'Omitir la bienvenida',
  /** Botón atrás que aparece al deslizar (F1-04). */
  anteriorEtiqueta: 'Página anterior',
  /** Etiqueta del indicador de páginas. */
  paso: (n: number, total: number) => `Paso ${n} de ${total}`,
} as const;
