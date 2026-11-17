import { useCallback, useRef, useState } from 'react';

import { useNative } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import type { MotivoSinSesion } from '../../domain/entities/Sesion.entities';
import { mensajesSesion } from '../../domain/sesion.mensajes';
import {
  agregarDigito,
  LONGITUD_PIN,
  quitarDigito,
  urlAyudaPin,
  validarUsuario,
} from '../../domain/validations/sesion.validations';
import { useSesionController } from './Sesion.controller';

export type PasoLogin = 'usuario' | 'pin';

export interface ILoginController {
  paso: PasoLogin;
  usuario: string;
  /** Dígitos escritos. Se vacía tras cada intento: nunca se guarda. */
  pin: string;
  /** Error del paso activo: validación del usuario o respuesta del login. */
  error: string | null;
  cargando: boolean;
  /** `vencida` si se llegó al login porque el servidor invalidó la sesión (401). */
  motivoAviso: MotivoSinSesion | null;
  _cambiarUsuario(texto: string): void;
  _continuar(): void;
  _volverAlUsuario(): void;
  _pulsarDigito(digito: string): void;
  _borrar(): void;
  _confirmar(): void;
  _abrirAyudaPin(): Promise<void>;
}

/**
 * Login en dos pasos: usuario y PIN. El paso vive aquí, no en la navegación. El PIN se envía solo
 * al 4.º dígito (P2), con un guard contra el doble envío.
 */
export function useLoginController(): ILoginController {
  const { estado, _iniciarSesion } = useSesionController();
  const enlaces = useNative('enlaces');
  const [paso, setPaso] = useState<PasoLogin>('usuario');
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const enviando = useRef(false);

  const enviar = useCallback(
    async (pinCompleto: string) => {
      if (enviando.current) {
        return;
      }
      enviando.current = true;
      setCargando(true);
      setError(null);
      try {
        const r = await _iniciarSesion({ usuario, pin: pinCompleto });
        if (r.error) {
          setError(r.msg ?? null);
        }
      } finally {
        setPin('');
        setCargando(false);
        enviando.current = false;
      }
    },
    [_iniciarSesion, usuario],
  );

  const _cambiarUsuario = useCallback((texto: string) => {
    setUsuario(texto);
    setError(null);
  }, []);

  const _continuar = useCallback(() => {
    const invalido = validarUsuario(usuario);
    if (invalido) {
      setError(invalido);
      return;
    }
    setError(null);
    setPin('');
    setPaso('pin');
  }, [usuario]);

  const _volverAlUsuario = useCallback(() => {
    if (enviando.current) {
      return;
    }
    setPin('');
    setError(null);
    setPaso('usuario');
  }, []);

  const _pulsarDigito = useCallback(
    (digito: string) => {
      if (enviando.current) {
        return;
      }
      const nuevo = agregarDigito(pin, digito);
      if (nuevo === pin) {
        return;
      }
      setPin(nuevo);
      setError(null);
      if (nuevo.length === LONGITUD_PIN) {
        enviar(nuevo);
      }
    },
    [pin, enviar],
  );

  const _borrar = useCallback(() => {
    if (!enviando.current) {
      setPin(actual => quitarDigito(actual));
    }
  }, []);

  const _confirmar = useCallback(() => {
    if (pin.length === LONGITUD_PIN) {
      enviar(pin);
    }
  }, [pin, enviar]);

  const _abrirAyudaPin = useCallback(async () => {
    const abierto = await enlaces.abrir(urlAyudaPin());
    if (!abierto) {
      notify.error(mensajesSesion.noSeAbrioWhatsApp);
    }
  }, [enlaces]);

  return {
    paso,
    usuario,
    pin,
    error,
    cargando,
    motivoAviso:
      estado.tipo === 'sinSesion' && estado.motivo ? estado.motivo : null,
    _cambiarUsuario,
    _continuar,
    _volverAlUsuario,
    _pulsarDigito,
    _borrar,
    _confirmar,
    _abrirAyudaPin,
  };
}
