import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';
import { textosComunes } from '@/shared/lib/textos';

import type { IResumenInicio } from '../../domain/entities/Inicio.entities';
import { mensajesInicio } from '../../domain/inicio.mensajes';
import { obtenerResumenInicioUseCase } from '../obtenerResumenInicio/obtenerResumenInicio';
import {
  construirVistaInicio,
  type IVistaInicio,
} from '../vistaInicio/vistaInicio';

/** Cada cuánto se recalcula la cuenta atrás (sin volver a pedir datos). */
export const INTERVALO_RELOJ_MS = 60 * 1000;

export type EstadoInicio =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; vista: IVistaInicio };

export interface IInicioController {
  estado: EstadoInicio;
  /** Pull-to-refresh en curso (los datos anteriores siguen en pantalla). */
  refrescando: boolean;
  /** Primera carga o «Reintentar»: vuelve a `cargando`. */
  _cargar(): Promise<void>;
  /** Pull-to-refresh: recarga sin quitar lo que se ve. */
  _refrescar(): Promise<void>;
  /** Abre el enlace de Zoom de la próxima clase. */
  _abrirClase(enlace: string): Promise<void>;
  /** Reagendar aún no existe en la App: avisa «Próximamente». */
  _reagendar(): void;
}

export interface IOpcionesInicioController {
  idEstudiante: string;
  /** Avisa los no leídos (insignia de la pestaña Mensajes) cada vez que cambian. */
  alCambiarNoLeidos?: (cantidad: number) => void;
  /** Reloj inyectable (tests). */
  ahora?: () => number;
}

/** Inicio del estudiante: carga, refresco, reloj de la cuenta atrás y acciones. */
export function useInicioController({
  idEstudiante,
  alCambiarNoLeidos,
  ahora = Date.now,
}: IOpcionesInicioController): IInicioController {
  const repo = useRepository('inicio');
  const enlaces = useNative('enlaces');
  const [resultado, setResultado] = useState<
    | { tipo: 'cargando' }
    | { tipo: 'error'; msg: string }
    | { tipo: 'listo'; resumen: IResumenInicio }
  >({ tipo: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  const [ahoraMs, setAhoraMs] = useState(ahora);
  const generacion = useRef(0);
  const montado = useRef(true);
  const yaListo = useRef(false);

  const leer = useCallback(async () => {
    const mia = ++generacion.current;
    const r = await obtenerResumenInicioUseCase(repo, { idEstudiante });
    // Una carga vieja (o con la pantalla ya desmontada) no pisa a la nueva.
    if (mia !== generacion.current || !montado.current) {
      return;
    }
    setAhoraMs(ahora());
    if (r.error || !r.response) {
      const msg = r.msg ?? textosComunes.errores.desconocido;
      // Si ya había datos, un refresco fallido los conserva y avisa con un toast.
      if (yaListo.current) {
        notify.error(mensajesInicio.noSeActualizo, msg);
        return;
      }
      setResultado({ tipo: 'error', msg });
      return;
    }
    yaListo.current = true;
    setResultado({ tipo: 'listo', resumen: r.response });
  }, [repo, idEstudiante, ahora]);

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
    const reloj = setInterval(() => setAhoraMs(ahora()), INTERVALO_RELOJ_MS);
    return () => clearInterval(reloj);
  }, [ahora]);

  const estado = useMemo<EstadoInicio>(
    () =>
      resultado.tipo === 'listo'
        ? {
            tipo: 'listo',
            vista: construirVistaInicio(resultado.resumen, ahoraMs),
          }
        : resultado,
    [resultado, ahoraMs],
  );

  const noLeidos = estado.tipo === 'listo' ? estado.vista.noLeidos : null;
  useEffect(() => {
    if (noLeidos !== null) {
      alCambiarNoLeidos?.(noLeidos);
    }
  }, [noLeidos, alCambiarNoLeidos]);

  const _abrirClase = useCallback(
    async (enlace: string) => {
      const abierto = await enlaces.abrir(enlace);
      if (!abierto) {
        notify.error(
          mensajesInicio.noSeAbrioClase,
          mensajesInicio.noSeAbrioClaseDetalle,
        );
      }
    },
    [enlaces],
  );

  const _reagendar = useCallback(() => {
    notify.info(
      mensajesInicio.proximamente,
      mensajesInicio.reagendarProximamente,
    );
  }, []);

  return {
    estado,
    refrescando,
    _cargar,
    _refrescar,
    _abrirClase,
    _reagendar,
  };
}
