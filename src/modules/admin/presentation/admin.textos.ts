/** Textos del inicio del admin (F1-04, 1.19). */
export const textosAdmin = {
  saludo: (nombre: string) => `Hola, ${nombre}`,
  subtitulo: 'Lo que hoy necesita tu atención',
  cargando: 'Cargando tu inicio',
  cerrarSesion: 'Cerrar sesión',
  seccionError: 'No pudimos cargar esta sección',
  reintentar: 'Reintentar',
  alertas: {
    titulo: 'Alertas',
    nada: 'Nada pendiente por ahora.',
    pagos: (n: number) => `Pagos pendientes · ${n}`,
    porVencer: (n: number) => `Ciclos por vencer · ${n}`,
    empiezanHoy: (n: number) => `Ciclos que empiezan hoy · ${n}`,
    flex: (n: number) => `Flex sin clases por agendar · ${n}`,
    termina: (fecha: string, dias: number) =>
      dias <= 0 ? `termina hoy (${fecha})` : `termina ${fecha} · ${dias} d`,
    usadas: (usadas: number, minimo: number) => `${usadas} de ${minimo} clases`,
  },
  asistencias: {
    titulo: 'Asistencias por marcar',
    nada: 'Todas las profes están al día.',
    total: (n: number) => (n === 1 ? '1 sin marcar' : `${n} sin marcar`),
    viejas: (n: number, desde: string) =>
      `${n} de hace más de 2 días · la más antigua, ${desde}`,
  },
  cumples: {
    titulo: 'Cumpleaños',
    nada: 'Sin cumpleaños en los próximos 14 días.',
    hoy: '¡Hoy!',
    manana: 'Mañana',
    en: (dias: number) => `En ${dias} días`,
  },
} as const;
