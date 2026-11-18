import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseConversacion,
  IResponseMedia,
  IResponseMensaje,
} from '../domain/entities/Mensajes.entities';
import type { MensajesRepository } from '../domain/models/MensajesRepository';

export interface IOpcionesMemoriaMensajes {
  /** Nombre con el que figuran los mensajes que se envían. */
  nombre?: string;
  /** `student` (por defecto) o `teacher`: de quién es la sesión. */
  rol?: 'student' | 'teacher';
  /** Fuerza el error de la siguiente operación indicada (p. ej. sin red). */
  falla?: Partial<
    Record<
      'hilo' | 'enviar' | 'marcarLeido' | 'reaccionar' | 'bandeja' | 'media',
      { msg: string; code?: number }
    >
  >;
  /** Imagen y voz por id de mensaje (lo que enviar guarda también queda aquí). */
  media?: Record<number, IResponseMedia>;
  /** Datos de la bandeja del profe. */
  conversaciones?: IResponseConversacion[];
}

/**
 * Puerto en memoria para pruebas: un hilo mutable. Enviar agrega un mensaje propio con el id
 * siguiente. Vacío por defecto.
 */
export function crearMemoriaMensajesRepository(
  inicial: IResponseMensaje[] = [],
  opciones: IOpcionesMemoriaMensajes = {},
): MensajesRepository & { mensajes: IResponseMensaje[] } {
  const mensajes = [...inicial];
  const media: Record<number, IResponseMedia> = { ...opciones.media };
  const rol = opciones.rol ?? 'student';
  const error = (k: keyof NonNullable<IOpcionesMemoriaMensajes['falla']>) =>
    opciones.falla?.[k];
  return {
    mensajes,
    async hilo({ despuesDe }) {
      const f = error('hilo');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      const ultimos =
        despuesDe > 0
          ? mensajes.filter(m => m.id > despuesDe)
          : mensajes.slice(-50);
      return respuestaOk({
        mensajes: ultimos,
        estados: mensajes.slice(-50).map(m => ({
          id: m.id,
          leido: m.leido,
          editado: m.editado,
          reacciones: m.reacciones,
        })),
      });
    },
    async enviar({ idEstudiante, texto, imagen, voz }) {
      const f = error('enviar');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      const id = mensajes.reduce((mayor, m) => Math.max(mayor, m.id), 0) + 1;
      const nuevo: IResponseMensaje = {
        id,
        idEstudiante,
        remitente: rol,
        nombre: opciones.nombre ?? null,
        texto,
        tieneImagen: Boolean(imagen),
        tieneVoz: Boolean(voz),
        leido: false,
        editado: false,
        reacciones: {},
        creado: '2026-11-18 09:00:00',
        mio: true,
      };
      mensajes.push(nuevo);
      if (imagen || voz) {
        media[id] = { imagen: imagen ?? null, voz: voz ?? null };
      }
      return respuestaOk(nuevo);
    },
    async marcarLeido() {
      const f = error('marcarLeido');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      let marcados = 0;
      mensajes.forEach((m, i) => {
        if (!m.mio && !m.leido) {
          mensajes[i] = { ...m, leido: true };
          marcados += 1;
        }
      });
      return respuestaOk({ marcados });
    },
    async reaccionar({ id, emoji }) {
      const f = error('reaccionar');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      const i = mensajes.findIndex(m => m.id === id);
      if (i < 0) {
        return respuestaError('Mensaje no encontrado.', 404);
      }
      const quien = rol === 'student' ? 'student:memoria' : 'teacher:memoria';
      const tenia = mensajes[i].reacciones[emoji]?.includes(quien);
      const reacciones = Object.fromEntries(
        Object.entries(mensajes[i].reacciones)
          .map(([e, q]) => [e, q.filter(x => x !== quien)] as const)
          .filter(([, q]) => q.length > 0),
      );
      if (!tenia) {
        reacciones[emoji] = [...(reacciones[emoji] ?? []), quien];
      }
      mensajes[i] = { ...mensajes[i], reacciones };
      return respuestaOk(reacciones);
    },
    async media(id) {
      const f = error('media');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      return media[id]
        ? respuestaOk(media[id])
        : respuestaError('Mensaje no encontrado.', 404);
    },
    async bandeja() {
      const f = error('bandeja');
      if (f) {
        return respuestaError(f.msg, f.code);
      }
      const conversaciones = opciones.conversaciones ?? [];
      return respuestaOk({
        conversaciones,
        noLeidos: conversaciones.reduce((s, c) => s + c.noLeidos, 0),
      });
    },
  };
}
