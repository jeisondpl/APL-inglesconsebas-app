import { useCallback, useEffect, useRef, useState } from 'react';

import { useNative } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import { mensajesTareas } from '../../domain/tareas.mensajes';
import {
  MAX_GRABACION_MS,
  MAX_VOZ,
  MIN_GRABACION_MS,
} from '../../domain/validations/tareas.validations';

export type EstadoGrabacion =
  | { tipo: 'inactiva' }
  | { tipo: 'grabando'; ms: number };

/** Audio ya grabado, a la espera de enviarse con la respuesta o el feedback. */
export interface IVozGrabada {
  dataUrl: string;
  duracionMs: number;
}

export interface IGrabadoraController {
  grabacion: EstadoGrabacion;
  /** La nota grabada y todavía no enviada. */
  voz: IVozGrabada | null;
  _grabar(): Promise<void>;
  /** Termina la grabación en curso y deja la nota lista (a los 2 min se corta sola). */
  _terminar(): Promise<void>;
  _cancelar(): Promise<void>;
  _descartarVoz(): void;
}

/**
 * Graba una nota de voz para adjuntarla a la entrega o al feedback (F3-02, 3.8 y 3.10). A diferencia
 * del chat, no se envía sola: queda en `voz` hasta que la persona envía el formulario.
 */
export function useGrabadora(): IGrabadoraController {
  const audio = useNative('audio');
  const [grabacion, setGrabacion] = useState<EstadoGrabacion>({
    tipo: 'inactiva',
  });
  const [voz, setVoz] = useState<IVozGrabada | null>(null);
  const grabando = useRef(false);
  const montado = useRef(true);

  const _cancelar = useCallback(async () => {
    if (!grabando.current) {
      return;
    }
    grabando.current = false;
    setGrabacion({ tipo: 'inactiva' });
    await audio.cancelarGrabacion();
  }, [audio]);

  const _terminar = useCallback(async () => {
    if (!grabando.current) {
      return;
    }
    grabando.current = false;
    setGrabacion({ tipo: 'inactiva' });
    const r = await audio.terminarGrabacion();
    if (!montado.current) {
      return;
    }
    if (r.tipo === 'error') {
      notify.error(mensajesTareas.noSePudoGrabar, r.msg);
      return;
    }
    if (r.duracionMs < MIN_GRABACION_MS) {
      notify.error(mensajesTareas.noSeEnvio, mensajesTareas.vozCorta);
      return;
    }
    if (r.dataUrl.length > MAX_VOZ) {
      notify.error(mensajesTareas.noSeEnvio, mensajesTareas.vozGrande);
      return;
    }
    setVoz({ dataUrl: r.dataUrl, duracionMs: r.duracionMs });
  }, [audio]);

  const terminarRef = useRef(_terminar);
  terminarRef.current = _terminar;

  const _grabar = useCallback(async () => {
    if (grabando.current) {
      return;
    }
    grabando.current = true;
    const r = await audio.empezarGrabacion(ms => {
      if (!montado.current || !grabando.current) {
        return;
      }
      setGrabacion({ tipo: 'grabando', ms });
      if (ms >= MAX_GRABACION_MS) {
        terminarRef.current();
      }
    });
    if (!montado.current) {
      return;
    }
    if (r.tipo !== 'ok') {
      grabando.current = false;
      notify.error(
        mensajesTareas.noSePudoGrabar,
        r.tipo === 'denegado' ? mensajesTareas.sinMicrofono : r.msg,
      );
      return;
    }
    setVoz(null);
    setGrabacion({ tipo: 'grabando', ms: 0 });
  }, [audio]);

  // Salir de la pantalla con una grabación abierta la descarta.
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (grabando.current) {
        grabando.current = false;
        audio.cancelarGrabacion();
      }
    };
  }, [audio]);

  const _descartarVoz = useCallback(() => setVoz(null), []);

  return { grabacion, voz, _grabar, _terminar, _cancelar, _descartarVoz };
}

export type EstadoReproduccion =
  | { tipo: 'cargando' }
  | { tipo: 'reposo' }
  | { tipo: 'reproduciendo' };

export interface IReproductorController {
  estado: EstadoReproduccion;
  /** Avance 0–1. */
  progreso: number;
  duracionMs: number | null;
  _alternar(): Promise<void>;
}

/**
 * Reproduce un audio (data URL) con su avance. Con `dataUrl` en `null` está «cargando». Solo suena
 * uno a la vez y se detiene al salir.
 */
export function useReproductor(
  dataUrl: string | null,
  clave: string,
  duracionConocidaMs: number | null = null,
): IReproductorController {
  const audio = useNative('audio');
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
      clave,
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
      notify.error(mensajesTareas.noSePudoReproducir, r.msg);
    }
  }, [sonando, dataUrl, audio, clave]);

  let estado: EstadoReproduccion;
  if (sonando) {
    estado = { tipo: 'reproduciendo' };
  } else if (dataUrl) {
    estado = { tipo: 'reposo' };
  } else {
    estado = { tipo: 'cargando' };
  }
  return {
    estado,
    progreso: avance.dur > 0 ? Math.min(1, avance.pos / avance.dur) : 0,
    duracionMs: avance.dur > 0 ? avance.dur : duracionConocidaMs,
    _alternar,
  };
}
