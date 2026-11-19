/** Textos del perfil (F1-03b, 1.14). */
export const textosPerfil = {
  titulo: 'Tu perfil',
  volver: 'Volver al inicio',
  volverEtiqueta: 'Inicio',
  rolEstudiante: 'Estudiante',
  rolProfe: 'Profe',
  usuario: (u: string) => `usuario ${u}`,
  tema: {
    titulo: 'Tema de la app',
    sistema: 'Sistema',
    claro: 'Claro',
    oscuro: 'Oscuro',
  },
  bloqueo: {
    titulo: 'Desbloqueo con huella o rostro',
    ayuda:
      'Al abrir la app, o si pasa un minuto en segundo plano, te pedimos tu huella o rostro.',
    activar: 'Activar el desbloqueo con huella o rostro',
  },
  web: {
    titulo: 'Más funciones en la web',
    ayuda:
      'Lo que aún no está en la App lo encuentras en la web. Se abre con tu sesión, sin escribir el PIN.',
    abrir: 'Abrir en la web',
  },
  pin: {
    titulo: 'Cambiar PIN',
    ayuda:
      'Escribe tu PIN actual y elige uno nuevo de 4 dígitos. Tus otros dispositivos tendrán que iniciar sesión de nuevo.',
    actual: 'PIN actual',
    nuevo: 'PIN nuevo',
    confirmar: 'Repite el PIN nuevo',
    cambiar: 'Cambiar PIN',
    errorTitulo: 'No se cambió el PIN',
  },
} as const;
