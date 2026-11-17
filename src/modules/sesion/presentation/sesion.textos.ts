/** Textos de la pantalla de login. Los mensajes de dominio están en domain/sesion.mensajes.ts. */
export const textosSesion = {
  /** Cabecera del login rediseñado (F1-04). */
  hero: {
    saludo: 'Hola de nuevo',
    subtitulo: 'Tus clases, tareas y mensajes te esperan.',
  },
  usuario: {
    titulo: 'Inicia sesión',
    subtitulo: 'Escribe tu usuario para continuar.',
    etiqueta: 'Usuario',
    marcador: 'tu usuario',
    continuar: 'Continuar',
  },
  pin: {
    titulo: (usuario: string) => `PIN para ${usuario}`,
    subtitulo: 'Escribe tu PIN de 4 dígitos.',
    /** Se anuncia el progreso, nunca los dígitos. */
    puntos: (escritos: number, total: number) =>
      `PIN: ${escritos} de ${total} dígitos`,
    digito: (digito: string) => `Dígito ${digito}`,
    borrar: 'Borrar',
    confirmar: 'Confirmar PIN',
    verificando: 'Verificando tu PIN',
    volverAlUsuario: 'Volver al usuario',
    ayuda: '¿Olvidaste tu PIN? Escríbenos por WhatsApp',
    ayudaPista: 'Abre WhatsApp con un mensaje para la academia',
  },
  tema: {
    aClaro: 'Cambiar a tema claro',
    aOscuro: 'Cambiar a tema oscuro',
  },
  sesionVencida: 'Tu sesión venció. Vuelve a iniciar sesión.',
  dominio: 'app.inglesconsebas.com',
} as const;
