import { useCallback, useEffect, useRef, useState } from 'react';

import { useNative } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import { mensajesChat } from '../../domain/mensajes.mensajes';
import type { IMensajeChat } from '../../domain/entities/Mensajes.entities';
import { useMediaController } from './Media.controller';

export type EstadoVoz =
  | { tipo: 'cargando' }
  /** No se pudo traer la nota del servidor. */
  | { tipo: 'error' }
  | { tipo: 'reposo' }
  | { tipo: 'reproduciendo' };

export interface IVozController {
  estado: EstadoVoz;
  /** Avance 0–1 de la reproducción. */
  progreso: number;
  /** Duración en ms si se sabe (la recién grabada o la que informa el reproductor). */
  duracionMs: number | null;
  _alternar(): Promise<void>;
  _reintentar(): Promise<void>;
}

/**
 * Nota de voz de un mensaje (F3-01, 3.2): la baja de Leap al mostrarse (con la caché de la foto),
 * la reproduce con su avance y la detiene al salir. Solo suena una nota a la vez.
 */
export function useVozController(m: IMensajeChat): IVozController {
  const audio = useNative('audio');
  const local = m.vozLocal;
  const media = useMediaController(m.id, !local && m.id > 0 && m.tieneVoz);
  const dataUrl =
    local ?? (media.estado.tipo === 'listo' ? media.estado.media.voz : null);
  const [sonando, setSonando] = useState(false);
  const [avance, setAvance] = useState({ pos: 0, dur: 0 });
  const montado = useRef(true);
  const sonandoRef = useRef(false);
  sonandoRef.current = sonando;

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (sonandoRef.current) {
        audio.detener();
      }
    };
  }, [audio]);

  const _alternar = useCallback(async () => {
    if (sonando) {
      await audio.detener();
      return;
    }
    if (!dataUrl) {
      return;
    }
    setSonando(true);
    const r = await audio.reproducir(dataUrl, {
      clave: m.id > 0 ? String(m.id) : `local${-m.id}`,
      alProgreso: (pos, dur) => {
        if (montado.current) {
          setAvance({ pos, dur });
        }
      },
      alTerminar: () => {
        if (montado.current) {
          setSonando(false);
          setAvance(a => ({ pos: 0, dur: a.dur }));
        }
      },
    });
    if (r.tipo === 'error' && montado.current) {
      setSonando(false);
      notify.error(mensajesChat.noSePudoReproducir, r.msg);
    }
  }, [sonando, dataUrl, audio, m.id]);

  let estado: EstadoVoz;
  if (sonando) {
    estado = { tipo: 'reproduciendo' };
  } else if (dataUrl) {
    estado = { tipo: 'reposo' };
  } else if (media.estado.tipo === 'error') {
    estado = { tipo: 'error' };
  } else {
    estado = { tipo: 'cargando' };
  }

  return {
    estado,
    progreso: avance.dur > 0 ? Math.min(1, avance.pos / avance.dur) : 0,
    duracionMs:
      avance.dur > 0
        ? avance.dur
        : m.duracionVozMs ??
          (media.estado.tipo === 'listo'
            ? media.estado.media.duracionMs
            : null) ??
          null,
    _alternar,
    _reintentar: media._reintentar,
  };
}
