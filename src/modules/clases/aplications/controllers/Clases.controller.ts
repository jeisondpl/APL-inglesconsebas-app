import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesClases } from '../../domain/clases.mensajes';
import type {
  ICicloClases,
  IResponseClase,
} from '../../domain/entities/Clases.entities';
import {
  ciclosDeClases,
  indiceCicloInicial,
} from '../../domain/validations/clases.validations';
import { obtenerClasesUseCase } from '../obtenerClases/obtenerClases';

/** Cada cuánto se recalcula «la próxima» (sin volver a pedir datos). */
export const INTERVALO_RELOJ_CLASES_MS = 60 * 1000;

export type EstadoClases =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; ciclos: ICicloClases[] };

export interface IClasesController {
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
