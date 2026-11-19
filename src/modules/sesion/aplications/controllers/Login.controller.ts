import { useCallback, useEffect, useRef, useState } from 'react';

import { useNative } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import type { MotivoSinSesion } from '../../domain/entities/Sesion.entities';
import { mensajesSesion } from '../../domain/sesion.mensajes';
import {
  agregarDigito,
  esDesafio,
  LONGITUD_PIN,
  normalizarUsuario,
  quitarDigito,
  urlAyudaPin,
  validarUsuario,
} from '../../domain/validations/sesion.validations';
import { useSesionController } from './Sesion.controller';

/** Estado HTTP con el que Leap dice que el desafío del código ya no vale (acceso-app.php). */
const CODIGO_DESAFIO_VENCIDO = 410;

/** `codigo`: el servidor pidió el código enviado por correo (doble factor, F1-06). */
export type PasoLogin = 'usuario' | 'pin' | 'codigo';

/** Datos del paso del código que necesita la pantalla. */
export interface ICodigoEnviado {
  correoEnmascarado: string;
  longitud: number;
  /** Segundos que faltan para poder pedir otro código (0 = ya se puede). */
  reenviarEn: number;
}

export interface ILoginController {
  paso: PasoLogin;
  usuario: string;
  /** Usuario tal como se envía (sin espacios y en minúsculas), para el título del paso PIN. */
  usuarioNormalizado: string;
  /**
   * Dígitos escritos del paso activo: el PIN en `pin` y el código en `codigo`. Se vacía tras cada
   * intento: nunca se guarda.
   */
  pin: string;
  /** Dígitos que pide el paso activo (4 del PIN o los del código). */
  longitud: number;
  /** Solo en el paso `codigo`. */
  codigoEnviado: ICodigoEnviado | null;
  /** Error del paso activo: validación del usuario o respuesta del servidor. */
  error: string | null;
  cargando: boolean;
  /** Mientras se abre el selector de Google y se valida en Leap. */
  cargandoGoogle: boolean;
  googleDisponible: boolean;
  /** `vencida` si se llegó al login porque el servidor invalidó la sesión (401). */
  motivoAviso: MotivoSinSesion | null;
  _cambiarUsuario(texto: string): void;
  _continuar(): void;
  _volverAlUsuario(): void;
  _pulsarDigito(digito: string): void;
  _borrar(): void;
  _confirmar(): void;
  _abrirAyudaPin(): Promise<void>;
  _reenviarCodigo(): Promise<void>;
  _continuarConGoogle(): Promise<void>;
}

/**
 * Login en dos pasos (usuario y PIN) y, si la persona tiene correo, un tercero con el código que
 * llega por correo (F1-06). También «Continuar con Google» desde el paso del usuario. El paso
 * vive aquí, no en la navegación. PIN y código se envían solos al último dígito (P2), con un
 * guard contra el doble envío.
 */
export function useLoginController(): ILoginController {
  const {
    estado,
    _iniciarSesion,
    _verificarCodigo,
    _reenviarCodigo: reenviar,
    googleDisponible,
    _iniciarConGoogle,
  } = useSesionController();
  const enlaces = useNative('enlaces');
  const [paso, setPaso] = useState<PasoLogin>('usuario');
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState<ICodigoEnviado | null>(
    null,
  );
  // El desafío solo vive en memoria mientras se escribe el código.
  const desafio = useRef<string | null>(null);
  const enviando = useRef(false);
  // Los dígitos viven también en una ref: dos toques seguidos antes de re-renderizar no se pierden.
  const pinActual = useRef('');
  const cambiarPin = useCallback((nuevo: string) => {
    pinActual.current = nuevo;
    setPin(nuevo);
  }, []);
  const longitud =
    paso === 'codigo' && codigoEnviado ? codigoEnviado.longitud : LONGITUD_PIN;

  // Cuenta atrás del reenvío, un tic por segundo mientras falte.
  const reenviarEn = codigoEnviado?.reenviarEn ?? 0;
  useEffect(() => {
    if (paso !== 'codigo' || reenviarEn <= 0) {
      return undefined;
    }
    const tic = setTimeout(
      () =>
        setCodigoEnviado(c =>
          c ? { ...c, reenviarEn: Math.max(c.reenviarEn - 1, 0) } : c,
        ),
      1000,
    );
    return () => clearTimeout(tic);
  }, [paso, reenviarEn]);

  const volverAlUsuario = useCallback(() => {
    desafio.current = null;
    setCodigoEnviado(null);
    cambiarPin('');
    setPaso('usuario');
  }, [cambiarPin]);

  const enviarPin = useCallback(
    async (pinCompleto: string) => {
      const r = await _iniciarSesion({ usuario, pin: pinCompleto });
      if (r.error) {
        setError(r.msg ?? null);
        return;
      }
      if (r.response && esDesafio(r.response)) {
        desafio.current = r.response.desafio;
        setCodigoEnviado({
          correoEnmascarado: r.response.correoEnmascarado,
          longitud: r.response.longitud,
          reenviarEn: r.response.reenviarEnSeg,
        });
        setPaso('codigo');
      }
    },
    [_iniciarSesion, usuario],
  );

  const enviarCodigo = useCallback(
    async (codigo: string) => {
      const r = await _verificarCodigo({
        desafio: desafio.current ?? '',
        codigo,
      });
      if (!r.error) {
        return;
      }
      // 410: el desafío venció, se agotaron los intentos o ya se usó. Se vuelve a empezar.
      if (r.code === CODIGO_DESAFIO_VENCIDO) {
        volverAlUsuario();
      }
      setError(r.msg ?? null);
    },
    [_verificarCodigo, volverAlUsuario],
  );

  const enviar = useCallback(
    async (digitos: string) => {
      if (enviando.current) {
        return;
      }
      enviando.current = true;
      setCargando(true);
      setError(null);
      try {
        await (paso === 'codigo' ? enviarCodigo(digitos) : enviarPin(digitos));
      } finally {
        cambiarPin('');
        setCargando(false);
        enviando.current = false;
      }
    },
    [paso, enviarCodigo, enviarPin, cambiarPin],
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
    cambiarPin('');
    setPaso('pin');
  }, [usuario, cambiarPin]);

  const _volverAlUsuario = useCallback(() => {
    if (enviando.current) {
      return;
    }
    setError(null);
    volverAlUsuario();
  }, [volverAlUsuario]);

  const _pulsarDigito = useCallback(
    (digito: string) => {
      if (enviando.current) {
        return;
      }
      const nuevo = agregarDigito(pinActual.current, digito, longitud);
      if (nuevo === pinActual.current) {
        return;
      }
      cambiarPin(nuevo);
      setError(null);
      if (nuevo.length === longitud) {
        enviar(nuevo);
      }
    },
    [enviar, cambiarPin, longitud],
  );

  const _borrar = useCallback(() => {
    if (!enviando.current) {
      cambiarPin(quitarDigito(pinActual.current));
    }
  }, [cambiarPin]);

  const _confirmar = useCallback(() => {
    if (pinActual.current.length === longitud) {
      enviar(pinActual.current);
    }
  }, [enviar, longitud]);

  const _abrirAyudaPin = useCallback(async () => {
    const abierto = await enlaces.abrir(urlAyudaPin());
    if (!abierto) {
      notify.error(mensajesSesion.noSeAbrioWhatsApp);
    }
  }, [enlaces]);

  const _reenviarCodigo = useCallback(async () => {
    if (!desafio.current || enviando.current || reenviarEn > 0) {
      return;
    }
    enviando.current = true;
    setError(null);
    try {
      const r = await reenviar(desafio.current);
      if (r.error || !r.response) {
        setError(r.msg ?? null);
        return;
      }
      const { correoEnmascarado, reenviarEnSeg } = r.response;
      setCodigoEnviado(c =>
        c
          ? {
              ...c,
              correoEnmascarado: correoEnmascarado || c.correoEnmascarado,
              reenviarEn: reenviarEnSeg,
            }
          : c,
      );
      notify.success(mensajesSesion.codigoReenviado);
    } finally {
      enviando.current = false;
    }
  }, [reenviar, reenviarEn]);

  const _continuarConGoogle = useCallback(async () => {
    if (enviando.current) {
      return;
    }
    enviando.current = true;
    setCargandoGoogle(true);
    setError(null);
    try {
      const r = await _iniciarConGoogle();
      if (r.tipo === 'respuesta' && r.respuesta.error) {
        setError(r.respuesta.msg ?? null);
      }
    } finally {
      setCargandoGoogle(false);
      enviando.current = false;
    }
  }, [_iniciarConGoogle]);

  return {
    paso,
    usuario,
    usuarioNormalizado: normalizarUsuario(usuario),
    pin,
    longitud,
    codigoEnviado,
    error,
    cargando,
    cargandoGoogle,
    googleDisponible,
    motivoAviso:
      estado.tipo === 'sinSesion' && estado.motivo ? estado.motivo : null,
    _cambiarUsuario,
    _continuar,
    _volverAlUsuario,
    _pulsarDigito,
    _borrar,
    _confirmar,
    _abrirAyudaPin,
    _reenviarCodigo,
    _continuarConGoogle,
  };
}
