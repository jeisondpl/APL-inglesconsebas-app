import { useCallback, useEffect, useRef, useState } from 'react';

import { useRepository } from '@/app/di';

import type { IResponseMedia } from '../../domain/entities/Mensajes.entities';
import type { MensajesRepository } from '../../domain/models/MensajesRepository';
import { textoDeError } from '../../domain/validations/mensajes.validations';
import { obtenerMediaUseCase } from '../hilo/hilo';

export type EstadoMedia =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; media: IResponseMedia };

export interface IMediaController {
  estado: EstadoMedia;
  _reintentar(): Promise<void>;
}

/** Lo ya descargado, por repositorio: la lista se desplaza y las burbujas se montan de nuevo. */
const descargado = new WeakMap<
  MensajesRepository,
  Map<number, IResponseMedia>
>();

function memoria(repo: MensajesRepository): Map<number, IResponseMedia> {
  let m = descargado.get(repo);
  if (!m) {
    m = new Map();
    descargado.set(repo, m);
  }
  return m;
}

/** Guarda lo que acabo de enviar: el mensaje ya viene del servidor y no hace falta pedirlo otra vez. */
export function recordarMedia(
  repo: MensajesRepository,
  id: number,
  media: IResponseMedia,
): void {
  memoria(repo).set(id, media);
}

/**
 * Imagen y voz de un mensaje (F3-01): la lista solo trae banderas, así que se piden al mostrar la
 * burbuja y se recuerdan mientras dure la sesión. Con `activo` false no se pide nada.
 */
export function useMediaController(
  id: number,
  activo: boolean,
): IMediaController {
  const repo = useRepository('mensajes');
  const [estado, setEstado] = useState<EstadoMedia>(() => {
    const ya = memoria(repo).get(id);
    return ya ? { tipo: 'listo', media: ya } : { tipo: 'cargando' };
  });
  const montado = useRef(true);

  const pedir = useCallback(async () => {
    const guardado = memoria(repo).get(id);
    if (guardado) {
      setEstado({ tipo: 'listo', media: guardado });
      return;
    }
    setEstado({ tipo: 'cargando' });
    const r = await obtenerMediaUseCase(repo, id);
    if (!montado.current) {
      return;
    }
    if (r.error || !r.response) {
      setEstado({ tipo: 'error', msg: textoDeError(r.msg) });
      return;
    }
    memoria(repo).set(id, r.response);
    setEstado({ tipo: 'listo', media: r.response });
  }, [repo, id]);

  useEffect(() => {
    montado.current = true;
    if (activo) {
      pedir();
    }
    return () => {
      montado.current = false;
    };
  }, [activo, pedir]);

  return { estado, _reintentar: pedir };
}
