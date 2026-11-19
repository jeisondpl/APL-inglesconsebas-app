import type { DestinoAviso } from './entities/Notificaciones.entities';

/**
 * Pestaña a la que lleva cada `tipo` de push (lo manda Leap en el `data`). Un tipo que esta versión
 * de la app no conoce no lleva a ninguna parte: la notificación solo abre la app.
 */
export function destinoDeAviso(tipo: string): DestinoAviso | null {
  if (tipo.startsWith('clase_')) {
    return 'clases';
  }
  if (tipo.startsWith('mensaje')) {
    return 'mensajes';
  }
  if (tipo.startsWith('tarea')) {
    return 'tareas';
  }
  return null;
}
