import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';
import { textosComunes } from '@/shared/lib/textos';

import type { IResumenInicioProfe } from '../../domain/entities/InicioProfe.entities';
import { mensajesInicio } from '../../domain/inicio.mensajes';
import { obtenerResumenInicioProfeUseCase } from '../obtenerResumenInicioProfe/obtenerResumenInicioProfe';
import {
  construirVistaInicioProfe,
  type IVistaInicioProfe,
} from '../vistaInicioProfe/vistaInicioProfe';
import { INTERVALO_RELOJ_MS } from './Inicio.controller';

export type EstadoInicioProfe =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; vista: IVistaInicioProfe };

export interface IInicioProfeController {
  estado: EstadoInicioProfe;
  ahoraMs: number;
  refrescando: boolean;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
  /** Abre el Zoom de una clase. */
  _abrirClase(enlace: string): Promise<void>;
  /** Marcar asistencia llega en F2-02: por ahora avisa «Próximamente». */
  _marcarAsistencia(): void;
}

export interface IOpcionesInicioProfeController {
  idProfe: string;
  alCambiarNoLeidos?: (cantidad: number) => void;
  /** Reloj inyectable (tests). */
  ahora?: () => number;
}

/**
 * Inicio del profe (F1-07): carga, refresco, reloj (los momentos de las clases cambian con la
 * hora) y acciones. Mismo comportamiento que el del estudiante: un refresco fallido conserva lo
 * que se ve y avisa con un toast.
 */
export function useInicioProfeController({
  idProfe,
  alCambiarNoLeidos,
  ahora = Date.now,
}: IOpcionesInicioProfeController): IInicioProfeController {
  const repo = useRepository('inicioProfe');
  const enlaces = useNative('enlaces');
  const [resultado, setResultado] = useState<
    | { tipo: 'cargando' }
    | { tipo: 'error'; msg: string }
    | { tipo: 'listo'; resumen: IResumenInicioProfe }
  >({ tipo: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  const [ahoraMs, setAhoraMs] = useState(ahora);
  const generacion = useRef(0);
  const montado = useRef(true);
  const yaListo = useRef(false);
  const reloj = useRef(ahora);
  reloj.current = ahora;

  const leer = useCallback(async () => {
    const mia = ++generacion.current;
    const r = await obtenerResumenInicioProfeUseCase(repo, { idProfe });
    if (mia !== generacion.current || !montado.current) {
      return;
    }
    setAhoraMs(reloj.current());
    if (r.error || !r.response) {
      const msg = r.msg ?? textosComunes.errores.desconocido;
      if (yaListo.current) {
        notify.error(mensajesInicio.noSeActualizo, msg);
        return;
      }
      setResultado({ tipo: 'error', msg });
      return;
    }
    yaListo.current = true;
    setResultado({ tipo: 'listo', resumen: r.response });
  }, [repo, idProfe]);

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
      INTERVALO_RELOJ_MS,
    );
    return () => clearInterval(intervalo);
  }, []);

  const estado = useMemo<EstadoInicioProfe>(
    () =>
      resultado.tipo === 'listo'
        ? {
            tipo: 'listo',
            vista: construirVistaInicioProfe(
              resultado.resumen,
              idProfe,
              ahoraMs,
              mensajesInicio.estudianteSinNombre,
            ),
          }
        : resultado,
    [resultado, idProfe, ahoraMs],
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

  const _marcarAsistencia = useCallback(() => {
    notify.info(
      mensajesInicio.proximamente,
      mensajesInicio.asistenciaProximamente,
    );
  }, []);

  return {
    estado,
    ahoraMs,
    refrescando,
    _cargar,
    _refrescar,
    _abrirClase,
    _marcarAsistencia,
  };
}
