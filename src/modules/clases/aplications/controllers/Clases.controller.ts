import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesClases } from '../../domain/clases.mensajes';
import type {
  ICicloClases,
  IResponseClase,
  OpcionCancelacion,
  VistaPreviaCancelacion,
} from '../../domain/entities/Clases.entities';
import {
  ciclosDeClases,
  indiceCicloInicial,
} from '../../domain/validations/clases.validations';
import {
  cancelarClaseUseCase,
  vistaPreviaCancelacionUseCase,
} from '../cancelarClase/cancelarClase';
import { obtenerClasesUseCase } from '../obtenerClases/obtenerClases';

/** Cada cuánto se recalcula «la próxima» (sin volver a pedir datos). */
export const INTERVALO_RELOJ_CLASES_MS = 60 * 1000;

export type EstadoClases =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; ciclos: ICicloClases[] };

/** La hoja de cancelar: cerrada, pidiendo la vista previa a Leap, o lista para confirmar. */
export type EstadoCancelacion =
  | { tipo: 'cerrada' }
  | { tipo: 'cargando'; idClase: string }
  | {
      tipo: 'lista';
      idClase: string;
      vista: VistaPreviaCancelacion;
      enviando: boolean;
      /** Error de la última confirmación (p. ej. la clase ya empezó). */
      error: string | null;
    };

/** Aviso al terminar: según el estado en que Leap dejó la clase (puede diferir del esperado). */
function avisoDeCancelacion(estadoFinal: string): string {
  if (estadoFinal === 'to_reschedule') {
    return mensajesClases.canceladaReagendar;
  }
  return estadoFinal === 'cancelled_no_impact'
    ? mensajesClases.cancelada
    : mensajesClases.canceladaTomada;
}

export interface IClasesController {
  cancelacion: EstadoCancelacion;
  /** Pide a Leap qué pasaría y abre la hoja de confirmación. */
  _abrirCancelacion(idClase: string): Promise<void>;
  _cerrarCancelacion(): void;
  /** Confirma; `opcion` es obligatoria si Leap dejó elegir. */
  _confirmarCancelacion(opcion?: OpcionCancelacion): Promise<void>;
  estado: EstadoClases;
  /** Ciclo que se está viendo (posición en `ciclos`, 0 = el más reciente). */
  indice: number;
  refrescando: boolean;
  ahoraMs: number;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
  /** Un ciclo hacia atrás en el tiempo. */
  _verAnterior(): void;
  /** Un ciclo hacia adelante en el tiempo. */
  _verSiguiente(): void;
  /** Abre el Zoom de la próxima clase. */
  _abrirClase(enlace: string): Promise<void>;
}

export interface IOpcionesClasesController {
  idEstudiante: string;
  /** Reloj inyectable (tests). */
  ahora?: () => number;
}

/**
 * Clases del estudiante (F2-01, 2.1): carga, refresco, ciclo que se ve y reloj. Un refresco
 * fallido conserva lo que se ve y avisa con un toast, como el inicio.
 */
export function useClasesController({
  idEstudiante,
  ahora = Date.now,
}: IOpcionesClasesController): IClasesController {
  const repo = useRepository('clases');
  const enlaces = useNative('enlaces');
  const [resultado, setResultado] = useState<
    | { tipo: 'cargando' }
    | { tipo: 'error'; msg: string }
    | { tipo: 'listo'; clases: IResponseClase[] }
  >({ tipo: 'cargando' });
  const [indice, setIndice] = useState(0);
  const [refrescando, setRefrescando] = useState(false);
  const [cancelacion, setCancelacion] = useState<EstadoCancelacion>({
    tipo: 'cerrada',
  });
  const enCancelacion = useRef(false);
  const [ahoraMs, setAhoraMs] = useState(ahora);
  const generacion = useRef(0);
  const montado = useRef(true);
  const yaListo = useRef(false);
  const reloj = useRef(ahora);
  reloj.current = ahora;

  const leer = useCallback(async () => {
    const mia = ++generacion.current;
    const r = await obtenerClasesUseCase(repo, { idEstudiante });
    if (mia !== generacion.current || !montado.current) {
      return;
    }
    const instante = reloj.current();
    setAhoraMs(instante);
    if (r.error || !r.response) {
      const msg = r.msg ?? textosComunes.errores.desconocido;
      if (yaListo.current) {
        notify.error(mensajesClases.noSeActualizo, msg);
        return;
      }
      setResultado({ tipo: 'error', msg });
      return;
    }
    // Solo la primera carga elige el ciclo: un refresco no mueve lo que la persona estaba viendo.
    if (!yaListo.current) {
      setIndice(indiceCicloInicial(ciclosDeClases(r.response, instante)));
    }
    yaListo.current = true;
    setResultado({ tipo: 'listo', clases: r.response });
  }, [repo, idEstudiante]);

  const _cargar = useCallback(async () => {
    yaListo.current = false;
    setResultado({ tipo: 'cargando' });
    await leer();
  }, [leer]);

  const _refrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await leer();
    } finally {
      if (montado.current) {
        setRefrescando(false);
      }
    }
  }, [leer]);

  useEffect(() => {
    montado.current = true;
    _cargar();
    return () => {
      montado.current = false;
    };
  }, [_cargar]);

  useEffect(() => {
    const intervalo = setInterval(
      () => setAhoraMs(reloj.current()),
      INTERVALO_RELOJ_CLASES_MS,
    );
    return () => clearInterval(intervalo);
  }, []);

  const estado = useMemo<EstadoClases>(
    () =>
      resultado.tipo === 'listo'
        ? { tipo: 'listo', ciclos: ciclosDeClases(resultado.clases, ahoraMs) }
        : resultado,
    [resultado, ahoraMs],
  );
  const total = estado.tipo === 'listo' ? estado.ciclos.length : 0;
  // Si al refrescar hay menos ciclos que antes, el índice no se sale de la lista.
  const indiceSeguro = Math.min(indice, Math.max(total - 1, 0));

  const _verAnterior = useCallback(
    () => setIndice(i => Math.min(i + 1, Math.max(total - 1, 0))),
    [total],
  );
  const _verSiguiente = useCallback(
    () => setIndice(i => Math.max(i - 1, 0)),
    [],
  );

  const _abrirCancelacion = useCallback(
    async (idClase: string) => {
      if (enCancelacion.current) {
        return;
      }
      enCancelacion.current = true;
      setCancelacion({ tipo: 'cargando', idClase });
      const r = await vistaPreviaCancelacionUseCase(repo, idClase);
      enCancelacion.current = false;
      if (!montado.current) {
        return;
      }
      if (r.error || !r.response) {
        setCancelacion({ tipo: 'cerrada' });
        notify.error(
          mensajesClases.noSeCancelo,
          r.msg ?? textosComunes.errores.desconocido,
        );
        return;
      }
      setCancelacion({
        tipo: 'lista',
        idClase,
        vista: r.response,
        enviando: false,
        error: null,
      });
    },
    [repo],
  );

  const _cerrarCancelacion = useCallback(() => {
    // Mientras se envía no se cierra: no se sabría si la clase se canceló.
    setCancelacion(c =>
      c.tipo === 'lista' && c.enviando ? c : { tipo: 'cerrada' },
    );
  }, []);

  const _confirmarCancelacion = useCallback(
    async (opcion?: OpcionCancelacion) => {
      if (cancelacion.tipo !== 'lista' || enCancelacion.current) {
        return;
      }
      const { idClase, vista } = cancelacion;
      enCancelacion.current = true;
      setCancelacion({ ...cancelacion, enviando: true, error: null });
      const r = await cancelarClaseUseCase(repo, { idClase, opcion }, vista);
      enCancelacion.current = false;
      if (!montado.current) {
        return;
      }
      if (r.error || !r.response) {
        setCancelacion({
          tipo: 'lista',
          idClase,
          vista,
          enviando: false,
          error: r.msg ?? textosComunes.errores.desconocido,
        });
        // Un 409 es que la clase cambió desde que se abrió la hoja: se refresca la lista.
        if (r.code === 409) {
          await leer();
        }
        return;
      }
      setCancelacion({ tipo: 'cerrada' });
      notify.success(avisoDeCancelacion(r.response.estadoFinal));
      await leer();
    },
    [cancelacion, repo, leer],
  );

  const _abrirClase = useCallback(
    async (enlace: string) => {
      const abierto = await enlaces.abrir(enlace);
      if (!abierto) {
        notify.error(
          mensajesClases.noSeAbrioClase,
          mensajesClases.noSeAbrioClaseDetalle,
        );
      }
    },
    [enlaces],
  );

  return {
    cancelacion,
    _abrirCancelacion,
    _cerrarCancelacion,
    _confirmarCancelacion,
    estado,
    indice: indiceSeguro,
    refrescando,
    ahoraMs,
    _cargar,
    _refrescar,
    _verAnterior,
    _verSiguiente,
    _abrirClase,
  };
}
