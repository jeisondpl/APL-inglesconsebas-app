import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

import { useNative, useRepository, useSesionActiva } from '@/app/di';
import type { HttpResponse } from '@/shared/lib/HttpResponse';

import type {
  EstadoSesion,
  IArgsIniciarSesion,
  IResponseSesion,
  IResponseUsuario,
} from '../../domain/entities/Sesion.entities';
import { arrancarSesionUseCase } from '../arrancarSesion/arrancarSesion';
import { cerrarSesionUseCase } from '../cerrarSesion/cerrarSesion';
import { iniciarSesionUseCase } from '../iniciarSesion/iniciarSesion';
import { crearRenovadorSesion } from '../renovarSesion/renovarSesion';

/** Estado de la sesión activa, suscrito a sus cambios. */
function useEstadoSesion(): EstadoSesion {
  const sesionActiva = useSesionActiva();
  return useSyncExternalStore(sesionActiva.suscribir, sesionActiva.obtener);
}

export interface ISesionController {
  estado: EstadoSesion;
  /** Usuario de la sesión, solo con el estado `autenticado`. */
  usuario: IResponseUsuario | null;
  _iniciarSesion(
    args: IArgsIniciarSesion,
  ): Promise<HttpResponse<IResponseSesion>>;
  _cerrarSesion(): Promise<void>;
}

/** Sesión actual, login y cierre de sesión. La navegación reacciona al cambio de estado. */
export function useSesionController(): ISesionController {
  const sesionActiva = useSesionActiva();
  const repo = useRepository('sesion');
  const almacen = useNative('almacenSeguro');
  const estado = useEstadoSesion();

  const _iniciarSesion = useCallback(
    async (args: IArgsIniciarSesion) => {
      const r = await iniciarSesionUseCase(repo, almacen, args);
      if (!r.error && r.response) {
        sesionActiva.establecer({ tipo: 'autenticado', sesion: r.response });
      }
      return r;
    },
    [repo, almacen, sesionActiva],
  );

  const _cerrarSesion = useCallback(async () => {
    // El logout sale con el token de la sesión: el estado cambia cuando termina (máx. 3 s).
    await cerrarSesionUseCase(repo, almacen);
    sesionActiva.establecer({ tipo: 'sinSesion', motivo: 'cerrada' });
  }, [repo, almacen, sesionActiva]);

  return {
    estado,
    usuario: estado.tipo === 'autenticado' ? estado.sesion.usuario : null,
    _iniciarSesion,
    _cerrarSesion,
  };
}

/**
 * Restaura la sesión al arrancar, una sola vez, y devuelve el estado. Mientras sea `restaurando`
 * el navegador no pinta nada y el splash nativo sigue visible.
 */
export function useArranqueSesion(): EstadoSesion {
  const sesionActiva = useSesionActiva();
  const repo = useRepository('sesion');
  const almacen = useNative('almacenSeguro');
  const estado = useEstadoSesion();
  const renovar = useMemo(() => crearRenovadorSesion(), []);
  const arrancado = useRef(false);

  useEffect(() => {
    if (arrancado.current || sesionActiva.obtener().tipo !== 'restaurando') {
      return;
    }
    arrancado.current = true;
    arrancarSesionUseCase({
      repo,
      almacen,
      sesionActiva,
      renovar,
      ahora: new Date(),
    });
  }, [repo, almacen, sesionActiva, renovar]);

  return estado;
}
