import type { ClienteApi } from '@/shared/lib/api';
import {
  respuestaError,
  respuestaOk,
  type HttpResponse,
} from '@/shared/lib/HttpResponse';
import { textosComunes } from '@/shared/lib/textos';

import type {
  IEstadoMensaje,
  IResponseBandeja,
  IResponseConversacion,
  IResponseHilo,
  IResponseMensaje,
  Reacciones,
  RemitenteChat,
} from '../domain/entities/Mensajes.entities';
import type { MensajesRepository } from '../domain/models/MensajesRepository';

const API = 'api.php';
const ENDPOINT = 'chat';

const REMITENTES: readonly RemitenteChat[] = ['student', 'teacher', 'admin'];

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const textoDe = (v: unknown): string | null =>
  typeof v === 'string' ? v : null;

const numeroDe = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Leap devuelve `{}` (objeto) o `[]` cuando no hay reacciones. */
export function reaccionesDe(v: unknown): Reacciones {
  if (!esObjeto(v)) {
    return {};
  }
  const salida: Reacciones = {};
  for (const [emoji, quienes] of Object.entries(v)) {
    if (Array.isArray(quienes)) {
      const lista = quienes.filter((q): q is string => typeof q === 'string');
      if (lista.length) {
        salida[emoji] = lista;
      }
    }
  }
  return salida;
}

export function mensajeDe(crudo: unknown): IResponseMensaje | null {
  if (!esObjeto(crudo)) {
    return null;
  }
  const id = numeroDe(crudo.id);
  const creado = textoDe(crudo.creado);
  const remitente = REMITENTES.find(r => r === crudo.remitente);
  if (id === null || !creado || !remitente) {
    return null;
  }
  return {
    id,
    idEstudiante: String(crudo.studentId ?? ''),
    remitente,
    nombre: textoDe(crudo.nombre),
    texto: textoDe(crudo.texto) ?? '',
    tieneImagen: crudo.tieneImagen === true,
    tieneVoz: crudo.tieneVoz === true,
    leido: crudo.leido === true,
    editado: crudo.editado === true,
    reacciones: reaccionesDe(crudo.reacciones),
    creado,
    mio: crudo.mio === true,
  };
}

export function estadoDe(crudo: unknown): IEstadoMensaje | null {
  if (!esObjeto(crudo)) {
    return null;
  }
  const id = numeroDe(crudo.id);
  return id === null
    ? null
    : {
        id,
        leido: crudo.leido === true,
        editado: crudo.editado === true,
        reacciones: reaccionesDe(crudo.reacciones),
      };
}

const sinNulos = <T>(lista: (T | null)[]): T[] =>
  lista.filter((x): x is T => x !== null);

function fallo<T>(r: HttpResponse<unknown>): HttpResponse<T> {
  return respuestaError(r.msg ?? textosComunes.errores.desconocido, r.code);
}

const formatoInvalido = <T>(r: HttpResponse<unknown>): HttpResponse<T> =>
  respuestaError(textosComunes.errores.respuestaInvalida, r.code);

/**
 * Adaptador del chat con el endpoint `chat` de Leap (mensajes.php). La lista nunca trae voz ni
 * imagen en base64: solo banderas. El remitente sale de la sesión en el servidor.
 */
export function crearApiMensajesRepository(
  api: ClienteApi,
): MensajesRepository {
  return {
    async hilo({ idEstudiante, despuesDe }) {
      const r = await api.get<unknown>(API, {
        endpoint: ENDPOINT,
        view: 'since',
        student_id: idEstudiante,
        after_id: String(despuesDe),
      });
      if (r.error) {
        return fallo(r);
      }
      const cuerpo = r.response;
      if (!esObjeto(cuerpo) || !Array.isArray(cuerpo.mensajes)) {
        return formatoInvalido(r);
      }
      const hilo: IResponseHilo = {
        mensajes: sinNulos(cuerpo.mensajes.map(mensajeDe)),
        estados: Array.isArray(cuerpo.estados)
          ? sinNulos(cuerpo.estados.map(estadoDe))
          : [],
      };
      return respuestaOk(hilo, r.code);
    },

    async enviar({ idEstudiante, texto, imagen, voz }) {
      const r = await api.post<unknown>(
        API,
        {
          action: 'app_send',
          studentId: idEstudiante,
          message: texto,
          ...(imagen ? { imageData: imagen } : {}),
          ...(voz ? { voiceData: voz } : {}),
        },
        { endpoint: ENDPOINT },
      );
      if (r.error) {
        return fallo(r);
      }
      const m = esObjeto(r.response) ? mensajeDe(r.response.mensaje) : null;
      return m ? respuestaOk(m, r.code) : formatoInvalido(r);
    },

    async marcarLeido(idEstudiante) {
      const r = await api.post<unknown>(
        API,
        { action: 'app_mark_read', studentId: idEstudiante },
        { endpoint: ENDPOINT },
      );
      if (r.error) {
        return fallo(r);
      }
      const marcados = esObjeto(r.response)
        ? numeroDe(r.response.marcados)
        : null;
      return respuestaOk({ marcados: marcados ?? 0 }, r.code);
    },

    async reaccionar({ id, emoji }) {
      const r = await api.post<unknown>(
        API,
        { action: 'app_react', id, emoji },
        { endpoint: ENDPOINT },
      );
      if (r.error) {
        return fallo(r);
      }
      return esObjeto(r.response)
        ? respuestaOk(reaccionesDe(r.response.reacciones), r.code)
        : formatoInvalido(r);
    },

    async media(id) {
      const r = await api.get<unknown>(API, {
        endpoint: ENDPOINT,
        view: 'media',
        id: String(id),
      });
      if (r.error) {
        return fallo(r);
      }
      return esObjeto(r.response)
        ? respuestaOk(
            {
              imagen: textoDe(r.response.imagen),
              voz: textoDe(r.response.voz),
            },
            r.code,
          )
        : formatoInvalido(r);
    },

    async bandeja() {
      const r = await api.get<unknown>(API, {
        endpoint: ENDPOINT,
        view: 'inbox',
      });
      if (r.error) {
        return fallo(r);
      }
      const cuerpo = r.response;
      if (!esObjeto(cuerpo) || !Array.isArray(cuerpo.conversaciones)) {
        return formatoInvalido(r);
      }
      const conversaciones = sinNulos(
        cuerpo.conversaciones.map((c): IResponseConversacion | null => {
          if (!esObjeto(c) || c.studentId === undefined) {
            return null;
          }
          return {
            idEstudiante: String(c.studentId),
            nombre: textoDe(c.nombre) ?? '',
            noLeidos: numeroDe(c.noLeidos) ?? 0,
            ultimo: mensajeDe(c.ultimo),
          };
        }),
      );
      const salida: IResponseBandeja = {
        conversaciones,
        noLeidos: numeroDe(cuerpo.noLeidos) ?? 0,
      };
      return respuestaOk(salida, r.code);
    },
  };
}
