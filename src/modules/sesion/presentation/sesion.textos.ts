/** Textos de la pantalla de login. Los mensajes de dominio están en domain/sesion.mensajes.ts. */
export const textosSesion = {
  /** Pantalla de bloqueo con huella o rostro (F1-03b, 1.13). */
  bloqueo: {
    titulo: 'App bloqueada',
    ayuda: 'Usa tu huella o rostro para continuar.',
    fallo: 'No pudimos verificarte. Inténtalo de nuevo.',
    desbloquear: 'Desbloquear',
    cerrarSesion: 'Cerrar sesión',
  },
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
    /** Separador entre el usuario y «Continuar con Google» (F1-06). */
    o: 'o',
  },
  /** Doble factor: el código que llega por correo (F1-06). */
  codigo: {
    titulo: 'Revisa tu correo',
    subtitulo: (correo: string) =>
      correo
        ? `Te enviamos un código de 6 dígitos a ${correo}.`
        : 'Te enviamos un código de 6 dígitos a tu correo.',
    puntos: (escritos: number, total: number) =>
      `Código: ${escritos} de ${total} dígitos`,
    confirmar: 'Confirmar código',
    verificando: 'Verificando tu código',
    reenviar: 'Reenviar código',
    reenviarEn: (segundos: number) => `Reenviar código en ${segundos} s`,
    volver: 'Volver al usuario',
    pista: 'Si no lo ves, revisa la carpeta de spam.',
  },
  google: {
    verificando: 'Conectando con Google',
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
