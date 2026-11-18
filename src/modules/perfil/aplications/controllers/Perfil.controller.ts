import { useCallback, useEffect, useRef, useState } from 'react';

import { useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import { mensajesPerfil, soloPin } from '../../domain/perfil.dominio';
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
}

/** Cambio del PIN propio (F1-03b, 1.14): tres campos de 4 dígitos y un envío. */
export function usePerfilController(): IPerfilController {
  const repo = useRepository('perfil');
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

  return {
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
