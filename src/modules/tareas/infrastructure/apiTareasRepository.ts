import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  EstadoTarea,
  IResponseListaTareas,
  IResponseMediaTarea,
  IResponseTarea,
} from '../domain/entities/Tareas.entities';
import type { TareasRepository } from '../domain/models/TareasRepository';

const API = 'api.php';
const ENDPOINT = 'tareas';

const ESTADOS: readonly EstadoTarea[] = ['pending', 'ready_review', 'reviewed'];

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null);

const entero = (v: unknown): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
};

/** Una tarea de Leap, o `null` si no trae lo mínimo (id, estudiante, título y un estado conocido). */
export function tareaDe(v: unknown): IResponseTarea | null {
  if (!esObjeto(v)) {
    return null;
  }
  const id = entero(v.id);
  const idEstudiante = texto(v.idEstudiante);
  const titulo = texto(v.titulo);
  const estado = ESTADOS.find(e => e === v.estado);
  if (id <= 0 || !idEstudiante || titulo === null || !estado) {
    return null;
  }
  return {
    id,
    idEstudiante,
    estudiante: texto(v.estudiante),
    titulo,
    instruccion: texto(v.instruccion) ?? '',
    tema: texto(v.tema),
    vence: texto(v.vence),
    estado,
    personalizada: v.personalizada === true,
    entrega: texto(v.entrega),
    entregadaEn: texto(v.entregadaEn),
    comentario: texto(v.comentario),
    nota: texto(v.nota),
    revisadaEn: texto(v.revisadaEn),
    feedbackVisto: v.feedbackVisto === true,
    creada: texto(v.creada) ?? '',
    tieneVozInstruccion: v.tieneVozInstruccion === true,
    tieneVozEntrega: v.tieneVozEntrega === true,
    tieneVozFeedback: v.tieneVozFeedback === true,
    imagenesInstruccion: entero(v.imagenesInstruccion),
    imagenesEntrega: entero(v.imagenesEntrega),
    archivos: entero(v.archivos),
  };
}

const invalida = <T>(code?: number): HttpResponse<T> =>
  respuestaError(textosComunes.errores.respuestaInvalida, code);

const fallo = <T>(r: HttpResponse<unknown>): HttpResponse<T> =>
  respuestaError(r.msg ?? textosComunes.errores.desconocido, r.code);

/** Adaptador del endpoint `tareas` de Leap (F3-02). Nunca lanza. */
export function crearApiTareasRepository(api: ClienteApi): TareasRepository {
  const accion = async (
    cuerpo: Record<string, unknown>,
  ): Promise<HttpResponse<void>> => {
    const r = await api.post<unknown>(API, cuerpo, { endpoint: ENDPOINT });
    return r.error ? fallo(r) : respuestaOk(undefined, r.code);
  };

  return {
    async listar() {
      const r = await api.get<unknown>(API, {
        endpoint: ENDPOINT,
        view: 'list',
      });
      if (r.error) {
        return fallo(r);
      }
      const d = r.response;
      if (!esObjeto(d) || !Array.isArray(d.tareas)) {
        return invalida(r.code);
      }
      const lista: IResponseListaTareas = {
        tareas: d.tareas
          .map(tareaDe)
          .filter((t): t is IResponseTarea => t !== null),
        pendientes: entero(d.pendientes),
        porRevisar: entero(d.porRevisar),
        feedbackNuevo: entero(d.feedbackNuevo),
      };
      return respuestaOk(lista, r.code);
    },

    async media(id, slot) {
      const r = await api.get<unknown>(API, {
        endpoint: ENDPOINT,
        view: 'media',
        id,
        slot,
      });
      if (r.error) {
        return fallo(r);
      }
      const d = r.response;
      if (!esObjeto(d)) {
        return invalida(r.code);
      }
      const media: IResponseMediaTarea = {
        voz: texto(d.voz),
        imagenes: Array.isArray(d.imagenes)
          ? d.imagenes.filter((i): i is string => typeof i === 'string')
          : [],
      };
      return respuestaOk(media, r.code);
    },

    entregar: ({ id, texto: respuesta, voz }) =>
      accion({
        action: 'app_submit',
        id,
        text: respuesta,
        ...(voz ? { voiceData: voz } : {}),
      }),

    revisar: ({ id, comentario, nota, voz }) =>
      accion({
        action: 'app_review',
        id,
        comment: comentario,
        grade: nota,
        ...(voz ? { voiceData: voz } : {}),
      }),

    marcarFeedbackVisto: id => accion({ action: 'app_feedback_seen', id }),
  };
}
