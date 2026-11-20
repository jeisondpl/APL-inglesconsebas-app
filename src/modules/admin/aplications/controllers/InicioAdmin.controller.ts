import { useCallback, useEffect, useRef, useState } from 'react';

import { useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import {
  mensajesAdmin,
  type AdminRepository,
  type IResumenAdmin,
  type SeccionAdmin,
} from '../../domain/admin.dominio';

/**
 * Carga las dos lecturas del admin a la vez; cada una puede fallar sin tirar a la otra (como el
 * inicio del estudiante y el del profe). Nunca lanza.
 */
export async function obtenerResumenAdminUseCase(
  repo: AdminRepository,
): Promise<IResumenAdmin> {
  const seccion = <T>(r: {
    error: boolean;
    response?: T;
    msg?: string;
  }): SeccionAdmin<T> =>
    !r.error && r.response !== undefined
      ? { tipo: 'ok', datos: r.response }
      : { tipo: 'error', msg: r.msg ?? '' };
  const [a, b] = await Promise.all([
    repo.alertas(),
    repo.asistenciasPendientes(),
  ]);
  return { alertas: seccion(a), asistencias: seccion(b) };
}

export type EstadoInicioAdmin =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; resumen: IResumenAdmin };

export interface IInicioAdminController {
  estado: EstadoInicioAdmin;
  refrescando: boolean;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
}

/** Inicio del admin (F1-04, 1.19): carga, refresco y reintento de las secciones que fallaron. */
export function useInicioAdminController(): IInicioAdminController {
  const repo = useRepository('admin');
  const [estado, setEstado] = useState<EstadoInicioAdmin>({ tipo: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const _cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const resumen = await obtenerResumenAdminUseCase(repo);
    if (montado.current) {
      setEstado({ tipo: 'listo', resumen });
    }
  }, [repo]);

  const _refrescar = useCallback(async () => {
    setRefrescando(true);
    const resumen = await obtenerResumenAdminUseCase(repo);
    if (!montado.current) {
      return;
    }
    setRefrescando(false);
    const todoFallo =
      resumen.alertas.tipo === 'error' && resumen.asistencias.tipo === 'error';
    if (todoFallo) {
      // Un refresco que falla del todo conserva lo que ya se ve y avisa.
      notify.error(mensajesAdmin.noSeActualizo);
      return;
    }
    setEstado({ tipo: 'listo', resumen });
  }, [repo]);

  useEffect(() => {
    _cargar();
  }, [_cargar]);

  return { estado, refrescando, _cargar, _refrescar };
}
