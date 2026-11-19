import { useCallback, useEffect, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { entorno } from '@/shared/lib/entorno';
import { notify } from '@/shared/lib/notify';

import { mensajesPerfil, soloPin } from '../../domain/perfil.dominio';
import { abrirWebUseCase } from '../abrirWeb/abrirWeb';
import { cambiarPinUseCase } from '../cambiarPin/cambiarPin';

export interface IPerfilController {
  actual: string;
  nuevo: string;
  confirmar: string;
  enviando: boolean;
  /** Por qué no se pudo cambiar (validación local o respuesta de Leap), junto al formulario. */
  error: string | null;
  _cambiarActual(v: string): void;
  _cambiarNuevo(v: string): void;
  _cambiarConfirmar(v: string): void;
  _cambiarPin(): Promise<void>;
  abriendoWeb: boolean;
  /** Abre la web con la sesión de la App (1.16). */
  _abrirWeb(): Promise<void>;
}

/** Cambio del PIN propio (F1-03b, 1.14): tres campos de 4 dígitos y un envío. */
export function usePerfilController(): IPerfilController {
  const repo = useRepository('perfil');
  const enlaces = useNative('enlaces');
  const [abriendoWeb, setAbriendoWeb] = useState(false);
  const [actual, setActual] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const editar = (poner: (v: string) => void) => (v: string) => {
    setError(null);
    poner(soloPin(v));
  };

  const _cambiarPin = useCallback(async () => {
    // El botón no responde mientras `enviando`, así que no hace falta otra guarda.
    setError(null);
    setEnviando(true);
    const r = await cambiarPinUseCase(repo, { actual, nuevo, confirmar });
    if (!montado.current) {
      return;
    }
    setEnviando(false);
    if (r.error) {
      setError(r.msg ?? mensajesPerfil.noSeCambio);
      return;
    }
    setActual('');
    setNuevo('');
    setConfirmar('');
    notify.success(
      mensajesPerfil.pinCambiado,
      mensajesPerfil.pinCambiadoDetalle,
    );
  }, [repo, actual, nuevo, confirmar]);

  const _abrirWeb = useCallback(async () => {
    setAbriendoWeb(true);
    const r = await abrirWebUseCase(repo, enlaces, entorno.webUrl);
    setAbriendoWeb(false);
    if (r.error) {
      notify.error(mensajesPerfil.noSePudoWeb, r.msg);
    }
  }, [repo, enlaces]);

  return {
    abriendoWeb,
    _abrirWeb,
    actual,
    nuevo,
    confirmar,
    enviando,
    error,
    _cambiarActual: editar(setActual),
    _cambiarNuevo: editar(setNuevo),
    _cambiarConfirmar: editar(setConfirmar),
    _cambiarPin,
  };
}
