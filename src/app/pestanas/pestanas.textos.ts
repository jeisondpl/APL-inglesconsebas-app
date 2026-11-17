/** Textos de la estructura de pestañas del estudiante (F1-05) y del profe (F1-07). */
export const textosPestanas = {
  inicio: 'Inicio',
  clases: 'Clases',
  mensajes: 'Mensajes',
  tareas: 'Tareas',
  sinLeer: (n: number) =>
    n === 1 ? '1 mensaje sin leer' : `${n} mensajes sin leer`,
  proximamente: 'Próximamente',
  pantallas: {
    clases: {
      titulo: 'Clases',
      mensaje:
        'Aquí vas a ver tu calendario, tus clases del ciclo y podrás reagendar.',
    },
    mensajes: {
      titulo: 'Mensajes',
      mensaje: 'Aquí vas a poder hablar con tu profe y con la academia.',
    },
    tareas: {
      titulo: 'Tareas',
      mensaje: 'Aquí vas a ver tus tareas, entregarlas y leer el feedback.',
    },
  },
  /** Pestañas del profe (F1-07). */
  pantallasProfe: {
    clases: {
      titulo: 'Clases',
      mensaje:
        'Aquí vas a ver tu horario, tus clases de la semana y marcar la asistencia.',
    },
    mensajes: {
      titulo: 'Mensajes',
      mensaje: 'Aquí vas a poder hablar con tus estudiantes.',
    },
    tareas: {
      titulo: 'Tareas',
      mensaje:
        'Aquí vas a revisar las tareas de tus estudiantes y dejarles feedback.',
    },
  },
} as const;
