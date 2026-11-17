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
  IArgsVerificarCodigo,
  IResponseReenvio,
  IResponseSesion,
  IResponseUsuario,
  ResultadoLogin,
} from '../../domain/entities/Sesion.entities';
import { esDesafio } from '../../domain/validations/sesion.validations';
import { arrancarSesionUseCase } from '../arrancarSesion/arrancarSesion';
import { cerrarSesionUseCase } from '../cerrarSesion/cerrarSesion';
import {
  iniciarConGoogleUseCase,
  type ResultadoGoogle,
} from '../iniciarConGoogle/iniciarConGoogle';
import { iniciarSesionUseCase } from '../iniciarSesion/iniciarSesion';
import { crearRenovadorSesion } from '../renovarSesion/renovarSesion';
import {
  reenviarCodigoUseCase,
  verificarCodigoUseCase,
} from '../verificarCodigo/verificarCodigo';

/** Estado de la sesión activa, suscrito a sus cambios. */
function useEstadoSesion(): EstadoSesion {
  const sesionActiva = useSesionActiva();
  return useSyncExternalStore(sesionActiva.suscribir, sesionActiva.obtener);
}

export interface ISesionController {
  estado: EstadoSesion;
  /** Usuario de la sesión, solo con el estado `autenticado`. */
  usuario: IResponseUsuario | null;
  /** Con correo registrado devuelve el desafío del código y aún no hay sesión (F1-06). */
  _iniciarSesion(
    args: IArgsIniciarSesion,
  ): Promise<HttpResponse<ResultadoLogin>>;
  _verificarCodigo(
    args: IArgsVerificarCodigo,
  ): Promise<HttpResponse<IResponseSesion>>;
  _reenviarCodigo(desafio: string): Promise<HttpResponse<IResponseReenvio>>;
  /** `false` si el build no tiene Google configurado: el botón no se muestra. */
  googleDisponible: boolean;
  _iniciarConGoogle(): Promise<ResultadoGoogle>;
  _cerrarSesion(): Promise<void>;
}

/** Sesión actual, login y cierre de sesión. La navegación reacciona al cambio de estado. */
export function useSesionController(): ISesionController {
  const sesionActiva = useSesionActiva();
  const repo = useRepository('sesion');
  const almacen = useNative('almacenSeguro');
  const google = useNative('google');
  const estado = useEstadoSesion();

  const entrar = useCallback(
    (sesion: IResponseSesion) =>
      sesionActiva.establecer({ tipo: 'autenticado', sesion }),
    [sesionActiva],
  );

  const _iniciarSesion = useCallback(
    async (args: IArgsIniciarSesion) => {
      const r = await iniciarSesionUseCase(repo, almacen, args);
      if (!r.error && r.response && !esDesafio(r.response)) {
        entrar(r.response);
      }
      return r;
    },
    [repo, almacen, entrar],
  );

  const _verificarCodigo = useCallback(
    async (args: IArgsVerificarCodigo) => {
      const r = await verificarCodigoUseCase(repo, almacen, args);
      if (!r.error && r.response) {
        entrar(r.response);
      }
      return r;
    },
    [repo, almacen, entrar],
  );

  const _reenviarCodigo = useCallback(
    (desafio: string) => reenviarCodigoUseCase(repo, desafio),
    [repo],
  );

  const _iniciarConGoogle = useCallback(async () => {
    const r = await iniciarConGoogleUseCase(repo, almacen, google);
    if (r.tipo === 'respuesta' && !r.respuesta.error && r.respuesta.response) {
      entrar(r.respuesta.response);
    }
    return r;
  }, [repo, almacen, google, entrar]);

  const _cerrarSesion = useCallback(async () => {
    // Antes de cualquier await: la sesión deja de ser vigente, así que ningún `me`/`renew` tardío
    // puede volver a guardarla mientras se cierra. token() sigue sirviendo para el Bearer del logout.
    sesionActiva.iniciarCierre();
    // El estado pasa a sinSesion cuando termina el cierre (máx. 3 s de logout + borrado).
    // Google olvida la cuenta en paralelo, para poder elegir otra en el siguiente login.
    await Promise.all([
      cerrarSesionUseCase(repo, almacen),
      google.cerrarSesion(),
    ]);
    sesionActiva.establecer({ tipo: 'sinSesion', motivo: 'cerrada' });
  }, [repo, almacen, google, sesionActiva]);

  return {
    estado,
    usuario: estado.tipo === 'autenticado' ? estado.sesion.usuario : null,
    _iniciarSesion,
    _verificarCodigo,
    _reenviarCodigo,
    googleDisponible: google.disponible,
    _iniciarConGoogle,
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
