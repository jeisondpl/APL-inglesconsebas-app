import { respuestaError, respuestaOk } from '@/shared/lib/HttpResponse';

import type {
  IResponseMediaTarea,
  IResponseTarea,
  SlotTarea,
} from '../domain/entities/Tareas.entities';
import type { TareasRepository } from '../domain/models/TareasRepository';

type Operacion = 'listar' | 'media' | 'entregar' | 'revisar' | 'visto';

export interface IOpcionesMemoriaTareas {
  /** Tareas iniciales. Vacío por defecto. */
  tareas?: IResponseTarea[];
  /** Contenido por `id:slot` (p. ej. `1:instruccion`). */
  media?: Record<string, IResponseMediaTarea>;
  /** Fuerza el error de la operación indicada (p. ej. sin red). */
  falla?: Partial<Record<Operacion, { msg: string; code?: number }>>;
}

export interface IMemoriaTareas extends TareasRepository {
  /** Lo que se mandó a entregar/revisar, en orden (para inspeccionarlo en los tests). */
  entregas: { id: number; texto: string; voz?: string }[];
  revisiones: { id: number; comentario: string; nota: string; voz?: string }[];
  vistos: number[];
}

/** Puerto en memoria para pruebas: entregar y revisar cambian el estado de la tarea. */
export function crearMemoriaTareasRepository(
  opciones: IOpcionesMemoriaTareas = {},
): IMemoriaTareas {
  let tareas = [...(opciones.tareas ?? [])];
  const entregas: IMemoriaTareas['entregas'] = [];
  const revisiones: IMemoriaTareas['revisiones'] = [];
  const vistos: number[] = [];
  const f = (o: Operacion) => opciones.falla?.[o];

  const cambiar = (id: number, cambio: Partial<IResponseTarea>) => {
    tareas = tareas.map(t => (t.id === id ? { ...t, ...cambio } : t));
  };

  return {
    entregas,
    revisiones,
    vistos,
    async listar() {
      const e = f('listar');
      if (e) {
        return respuestaError(e.msg, e.code);
      }
      return respuestaOk({
        tareas,
        pendientes: tareas.filter(t => t.estado === 'pending').length,
        porRevisar: tareas.filter(t => t.estado === 'ready_review').length,
        feedbackNuevo: tareas.filter(
          t => t.estado === 'reviewed' && !t.feedbackVisto,
        ).length,
      });
    },
    async media(id, slot: SlotTarea) {
      const e = f('media');
      if (e) {
        return respuestaError(e.msg, e.code);
      }
      return respuestaOk(
        opciones.media?.[`${id}:${slot}`] ?? { voz: null, imagenes: [] },
      );
    },
    async entregar({ id, texto, voz }) {
      const e = f('entregar');
      if (e) {
        return respuestaError(e.msg, e.code);
      }
      entregas.push({ id, texto, voz });
      cambiar(id, {
        estado: 'ready_review',
        entrega: texto || null,
        tieneVozEntrega: Boolean(voz),
        entregadaEn: '2026-11-18 10:00:00',
      });
      return respuestaOk(undefined);
    },
    async revisar({ id, comentario, nota, voz }) {
      const e = f('revisar');
      if (e) {
        return respuestaError(e.msg, e.code);
      }
      revisiones.push({ id, comentario, nota, voz });
      cambiar(id, {
        estado: 'reviewed',
        comentario: comentario || null,
        nota: nota || null,
        tieneVozFeedback: Boolean(voz),
        feedbackVisto: false,
        revisadaEn: '2026-11-18 11:00:00',
      });
      return respuestaOk(undefined);
    },
    async marcarFeedbackVisto(id) {
      const e = f('visto');
      if (e) {
        return respuestaError(e.msg, e.code);
      }
      vistos.push(id);
      cambiar(id, { feedbackVisto: true });
      return respuestaOk(undefined);
    },
  };
}

/** Una tarea pendiente de ejemplo para pruebas; `t` pisa lo que se quiera. */
export const tareaDePrueba = (
  t: Partial<IResponseTarea> = {},
): IResponseTarea => ({
  id: 1,
  idEstudiante: 's1',
  estudiante: 'Ana Torres',
  titulo: 'Morning routine',
  instruccion: 'Describe tu rutina.',
  tema: null,
  vence: '2026-11-22',
  estado: 'pending',
  personalizada: true,
  entrega: null,
  entregadaEn: null,
  comentario: null,
  nota: null,
  revisadaEn: null,
  feedbackVisto: false,
  creada: '2026-11-17 10:00:00',
  tieneVozInstruccion: false,
  tieneVozEntrega: false,
  tieneVozFeedback: false,
  imagenesInstruccion: 0,
  imagenesEntrega: 0,
  archivos: 0,
  ...t,
});
