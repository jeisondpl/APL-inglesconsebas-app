import { DESFASE_BOGOTA_MS, partesFecha } from '@/shared/lib/fechas';
import { textosComunes } from '@/shared/lib/textos';

import type {
  FilaHilo,
  IEstadoMensaje,
  IMensajeChat,
  IReaccionResumen,
  IResponseMensaje,
  Reacciones,
} from '../entities/Mensajes.entities';

/** Tope de la foto como data URL (el servidor rechaza más de 2 000 000 caracteres). */
export const MAX_IMAGEN = 2000000;

/** Largo máximo del texto: el mismo que impone Leap (`CHAT_MAX_TEXTO`). */
export const MAX_TEXTO = 2000;

/** Emojis que admite Leap (`CHAT_EMOJIS`), sin el selector de variación. */
export const EMOJIS_REACCION = ['👍', '❤', '😂', '😮', '🙏', '👏'] as const;

/** Quita el selector de variación (U+FE0F): ❤ y ❤️ son la misma reacción. */
export const normalizarEmoji = (emoji: string): string =>
  emoji.replace(/️/g, '');

/** `null` si el texto se puede enviar; si no, por qué. */
export function problemaDelTexto(texto: string): 'vacio' | 'largo' | null {
  const limpio = texto.trim();
  if (!limpio) {
    return 'vacio';
  }
  return limpio.length > MAX_TEXTO ? 'largo' : null;
}

/** Une los mensajes que ya había con los nuevos y aplica el estado de los últimos. */
export function combinarHilo(
  actuales: IResponseMensaje[],
  nuevos: IResponseMensaje[],
  estados: IEstadoMensaje[] = [],
): IResponseMensaje[] {
  const porId = new Map<number, IResponseMensaje>();
  for (const m of actuales) {
    porId.set(m.id, m);
  }
  for (const m of nuevos) {
    porId.set(m.id, m);
  }
  for (const e of estados) {
    const m = porId.get(e.id);
    if (m) {
      porId.set(e.id, {
        ...m,
        leido: e.leido,
        editado: e.editado,
        reacciones: e.reacciones,
      });
    }
  }
  return [...porId.values()].sort((a, b) => a.id - b.id);
}

/** Id del último mensaje que ya está en el servidor (0 si no hay). */
export const ultimoIdServidor = (mensajes: IResponseMensaje[]): number =>
  mensajes.reduce((mayor, m) => (m.id > mayor ? m.id : mayor), 0);

/** Mensajes del otro lado que yo todavía no he leído. */
export const noLeidosDelOtro = (mensajes: IResponseMensaje[]): number =>
  mensajes.filter(m => !m.mio && !m.leido).length;

/** `Y-m-d` de una marca `Y-m-d H:i:s`. */
export const fechaDeMarca = (creado: string): string => creado.slice(0, 10);

/** `HH:mm` de una marca `Y-m-d H:i:s`. */
export const horaDeMarca = (creado: string): string => creado.slice(11, 16);

/** Marca `Y-m-d H:i:s` de un instante, en hora de Bogotá. */
export const marcaDeInstante = (ms: number): string =>
  new Date(ms + DESFASE_BOGOTA_MS).toISOString().replace('T', ' ').slice(0, 19);

/** Día anterior de una fecha `Y-m-d`. */
export function ayerDe(fecha: string): string {
  const p = partesFecha(fecha);
  if (!p) {
    return fecha;
  }
  return new Date(Date.UTC(p.anio, p.mes - 1, p.dia - 1))
    .toISOString()
    .slice(0, 10);
}

/** Filas del hilo en orden cronológico, con un separador al empezar cada día. */
export function filasDelHilo(mensajes: IMensajeChat[]): FilaHilo[] {
  const filas: FilaHilo[] = [];
  let dia = '';
  for (const mensaje of mensajes) {
    const fecha = fechaDeMarca(mensaje.creado);
    if (fecha !== dia) {
      dia = fecha;
      filas.push({ tipo: 'dia', fecha });
    }
    filas.push({ tipo: 'mensaje', mensaje });
  }
  return filas;
}

/** Reacciones agrupadas por emoji, con cuántos reaccionaron y si yo soy uno. */
export function resumenReacciones(
  reacciones: Reacciones,
  miReactor: string,
): IReaccionResumen[] {
  return Object.entries(reacciones)
    .filter(([, quienes]) => quienes.length > 0)
    .map(([emoji, quienes]) => ({
      emoji,
      cantidad: quienes.length,
      mia: quienes.includes(miReactor),
    }));
}

/** Cómo figuro en las reacciones: el mismo formato que usa Leap. */
export const miReactor = (
  rol: 'estudiante' | 'profe',
  id: string,
  nombre: string,
): string => (rol === 'estudiante' ? `student:${id}` : `teacher:${nombre}`);

/** El mensaje de un error de la API o, si no trae, el genérico. */
export const textoDeError = (msg?: string): string =>
  msg ?? textosComunes.errores.desconocido;
