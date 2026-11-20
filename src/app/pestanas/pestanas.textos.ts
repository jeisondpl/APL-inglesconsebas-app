/** Textos de la estructura de pestañas del estudiante (F1-05) y del profe (F1-07). */
export const textosPestanas = {
  inicio: 'Inicio',
  clases: 'Clases',
  mensajes: 'Mensajes',
  tareas: 'Tareas',
  sinLeer: (n: number) =>
    n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`,
} as const;
