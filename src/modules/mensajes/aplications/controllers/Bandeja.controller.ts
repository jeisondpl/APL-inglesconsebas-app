import { useCallback, useEffect, useRef, useState } from 'react';

import { useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import { mensajesChat } from '../../domain/mensajes.mensajes';
import type { IResponseBandeja } from '../../domain/entities/Mensajes.entities';
import { textoDeError } from '../../domain/validations/mensajes.validations';
import { obtenerBandejaUseCase } from '../bandeja/bandeja';

/** Cada cuánto se refresca la bandeja del profe con la pestaña abierta. */
export const INTERVALO_BANDEJA_MS = 10000;

export type EstadoBandeja =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; bandeja: IResponseBandeja };

export interface IBandejaController {
  estado: EstadoBandeja;
  refrescando: boolean;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
}

export interface IOpcionesBandejaController {
  /** Con false (hilo abierto, otra pestaña) no se sondea. */
  activo?: boolean;
  /** Total de no leídos de todos sus estudiantes: alimenta la insignia de la pestaña. */
  alCambiarNoLeidos?: (n: number) => void;
}

/** Bandeja del profe (F3-01, 3.5): sus estudiantes con el último mensaje y los no leídos. */
export function useBandejaController({
  activo = true,
  alCambiarNoLeidos,
}: IOpcionesBandejaController = {}): IBandejaController {
  const repo = useRepository('mensajes');
  const [estado, setEstado] = useState<EstadoBandeja>({ tipo: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  const montado = useRef(true);
  const yaListo = useRef(false);
  const enCurso = useRef(false);
  const generacion = useRef(0);
  const avisarRef = useRef(alCambiarNoLeidos);
  avisarRef.current = alCambiarNoLeidos;

  const leer = useCallback(
    async (silencioso: boolean) => {
      const mia = ++generacion.current;
      const r = await obtenerBandejaUseCase(repo);
      if (mia !== generacion.current || !montado.current) {
        return;
      }
      if (r.error || !r.response) {
        const msg = textoDeError(r.msg);
        if (yaListo.current) {
          if (!silencioso) {
            notify.error(mensajesChat.noSeActualizo, msg);
          }
          return;
        }
        setEstado({ tipo: 'error', msg });
        return;
      }
      yaListo.current = true;
      setEstado({ tipo: 'listo', bandeja: r.response });
      avisarRef.current?.(r.response.noLeidos);
    },
    [repo],
  );

  const _cargar = useCallback(async () => {
    yaListo.current = false;
    setEstado({ tipo: 'cargando' });
    await leer(false);
  }, [leer]);

  const _refrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await leer(false);
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
    if (!activo) {
      return undefined;
    }
    // Al volver de un hilo se actualiza al instante y luego cada 10 s.
    const sondear = async () => {
      if (enCurso.current || !yaListo.current) {
        return;
      }
      enCurso.current = true;
      await leer(true);
      enCurso.current = false;
    };
    sondear();
    const intervalo = setInterval(sondear, INTERVALO_BANDEJA_MS);
    return () => clearInterval(intervalo);
  }, [activo, leer]);

  return { estado, refrescando, _cargar, _refrescar };
}
