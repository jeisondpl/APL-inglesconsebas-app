import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useBloqueo, useNative } from '@/app/di';

import {
  arrancarBloqueoUseCase,
  debeVolverABloquear,
  olvidarBloqueoUseCase,
} from '../bloqueo/bloqueo';

/**
 * Bloqueo biométrico del navegador raíz (F1-03b, 1.13): al tener sesión lee si estaba activo
 * (arranca bloqueada), al perderla lo olvida y, estando activo, vuelve a bloquear si la app pasó
 * más de un minuto en segundo plano.
 */
export function useArranqueBloqueo(autenticado: boolean): void {
  const almacen = useNative('almacenSeguro');
  const biometria = useNative('biometria');
  const bloqueo = useBloqueo();
  const habiaSesion = useRef(false);

  useEffect(() => {
    if (autenticado) {
      habiaSesion.current = true;
      arrancarBloqueoUseCase(almacen, biometria, bloqueo);
    } else if (habiaSesion.current) {
      habiaSesion.current = false;
      olvidarBloqueoUseCase(almacen, biometria, bloqueo);
    }
  }, [autenticado, almacen, biometria, bloqueo]);

  useEffect(() => {
    let salioEn: number | null = null;
    const suscripcion = AppState.addEventListener('change', estado => {
      if (estado === 'background') {
        salioEn = Date.now();
      } else if (estado === 'active' && salioEn !== null) {
        if (debeVolverABloquear(salioEn, Date.now())) {
          bloqueo.bloquear();
        }
        salioEn = null;
      }
    });
    return () => suscripcion.remove();
  }, [bloqueo]);
}

export interface IBloqueoController {
  /** La verificación no pasó (cancelada o fallida): se ofrece reintentar o cerrar sesión. */
  falloVerificacion: boolean;
  verificando: boolean;
  _desbloquear(): Promise<void>;
}

/** Pantalla de bloqueo: pide huella o rostro al abrirse y al reintentar. */
export function useBloqueoController(): IBloqueoController {
  const biometria = useNative('biometria');
  const bloqueo = useBloqueo();
  const [verificando, setVerificando] = useState(false);
  const [falloVerificacion, setFallo] = useState(false);
  const montado = useRef(true);

  const _desbloquear = useCallback(async () => {
    setVerificando(true);
    const r = await biometria.autenticar();
    if (!montado.current) {
      return;
    }
    setVerificando(false);
    if (r.tipo === 'ok') {
      setFallo(false);
      bloqueo.desbloquear();
    } else {
      setFallo(true);
    }
  }, [biometria, bloqueo]);

  useEffect(() => {
    montado.current = true;
    _desbloquear();
    return () => {
      montado.current = false;
    };
  }, [_desbloquear]);

  return { falloVerificacion, verificando, _desbloquear };
}
