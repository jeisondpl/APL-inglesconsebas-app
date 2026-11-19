import { hoyBogota } from '@/shared/lib/fechas';

import type {
  IResponseTarea,
  SeccionTareas,
} from '../entities/Tareas.entities';

/** Los mismos topes que impone Leap (`tareas.php`). */
export const MAX_TEXTO_ENTREGA = 8000;
export const MAX_COMENTARIO = 4000;
export const MAX_NOTA = 20;
/** Tope del audio como data URL (Leap rechaza más de 3 000 000 caracteres). */
export const MAX_VOZ = 3000000;
export const MAX_GRABACION_MS = 120000;
export const MIN_GRABACION_MS = 700;

/** `0:07`, `1:05`: duración de un audio. */
export function duracionDeVoz(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const s = total % 60;
  return `${Math.floor(total / 60)}:${s < 10 ? '0' : ''}${s}`;
}

/** Sección a la que pertenece una tarea según su estado. */
export function seccionDe(t: IResponseTarea): SeccionTareas {
  if (t.estado === 'reviewed') {
    return 'revisadas';
  }
  return t.estado === 'ready_review' ? 'porRevisar' : 'pendientes';
}

/**
 * Orden de cada sección: lo pendiente por fecha de entrega (lo que vence antes, primero; sin fecha,
 * al final) y lo demás por lo más reciente.
 */
export function ordenarSeccion(
  tareas: IResponseTarea[],
  seccion: SeccionTareas,
): IResponseTarea[] {
  const copia = [...tareas];
  if (seccion === 'pendientes') {
    return copia.sort(
      (a, b) =>
        (a.vence ?? '9999-12-31').localeCompare(b.vence ?? '9999-12-31') ||
        a.id - b.id,
    );
  }
  return copia.sort((a, b) => b.id - a.id);
}

/** Tareas de una sección, ya ordenadas. */
export function tareasDeSeccion(
  tareas: IResponseTarea[],
  seccion: SeccionTareas,
): IResponseTarea[] {
  return ordenarSeccion(
    tareas.filter(t => seccionDe(t) === seccion),
    seccion,
  );
}

/** Una tarea sin entregar cuya fecha ya pasó. */
export function estaVencida(t: IResponseTarea, ahoraMs: number): boolean {
  return (
    t.estado === 'pending' && t.vence !== null && t.vence < hoyBogota(ahoraMs)
  );
}

/** Quita lo que Leap no acepta y devuelve el texto listo para enviar. */
export const limpiar = (texto: string): string => texto.trim();
