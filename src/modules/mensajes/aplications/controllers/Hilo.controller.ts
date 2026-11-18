import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import { mensajesChat } from '../../domain/mensajes.mensajes';
import type {
  IMensajeChat,
  IResponseMensaje,
  OrigenFoto,
} from '../../domain/entities/Mensajes.entities';
import {
  combinarHilo,
  MAX_GRABACION_MS,
  MAX_IMAGEN,
  MAX_VOZ,
  MIN_GRABACION_MS,
  marcaDeInstante,
  noLeidosDelOtro,
  problemaDelTexto,
  textoDeError,
  ultimoIdServidor,
} from '../../domain/validations/mensajes.validations';
import { recordarMedia } from './Media.controller';
import {
  enviarMensajeUseCase,
  marcarLeidoUseCase,
  obtenerHiloUseCase,
  reaccionarUseCase,
} from '../hilo/hilo';

/** Cada cuánto se piden los mensajes nuevos con el chat abierto (sondeo liviano, 3.6). */
export const INTERVALO_SONDEO_HILO_MS = 4000;

export type EstadoHilo =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo' };

/** Lo que se envía junto al texto. */
interface IAdjunto {
  imagen?: string;
  voz?: string;
  /** Duración de la nota recién grabada, para mostrarla sin descargarla. */
  duracionMs?: number;
}

export type EstadoGrabacion =
  | { tipo: 'inactiva' }
  | { tipo: 'grabando'; ms: number };

interface IPendiente extends IAdjunto {
  clave: number;
  texto: string;
  envio: 'enviando' | 'fallido';
  creado: string;
}

export interface IHiloController {
  estado: EstadoHilo;
  /** Orden cronológico: los del servidor y, al final, los propios que aún no llegan. */
  mensajes: IMensajeChat[];
  texto: string;
  /** Mensaje cuya hoja de reacciones está abierta (id del servidor), o null. */
  seleccion: IMensajeChat | null;
  grabacion: EstadoGrabacion;
  _cargar(): Promise<void>;
  _cambiarTexto(texto: string): void;
  _enviar(): Promise<void>;
  /** Elige o toma una foto y la envía con el texto escrito como pie. */
  _adjuntarImagen(origen: OrigenFoto): Promise<void>;
  /** Empieza a grabar una nota de voz (pide el micrófono la primera vez). */
  _grabar(): Promise<void>;
  _cancelarGrabacion(): Promise<void>;
  /** Termina la grabación y la envía. */
  _enviarGrabacion(): Promise<void>;
  _reintentar(clave: number): Promise<void>;
  _descartar(clave: number): void;
  _abrirReacciones(id: number): void;
  _cerrarReacciones(): void;
  _reaccionar(emoji: string): Promise<void>;
}

export interface IOpcionesHiloController {
  /** Hilo (id del estudiante). */
  idEstudiante: string;
  rol: 'estudiante' | 'profe';
  /** Con false (otra pestaña, hilo cerrado) no se sondea. */
  activo?: boolean;
  /** Se llama tras marcar como leídos los mensajes del otro lado (baja la insignia). */
  alLeer?: () => void;
  ahora?: () => number;
}

/**
 * Hilo del chat (F3-01): carga los últimos mensajes, sondea solo lo nuevo, envía con mensaje
 * optimista (con reintento si falla), marca como leído lo que llega y reacciona. Leap decide el
 * remitente y el «leído»; la App solo muestra.
 */
export function useHiloController({
  idEstudiante,
  rol,
  activo = true,
  alLeer,
  ahora = Date.now,
}: IOpcionesHiloController): IHiloController {
  const repo = useRepository('mensajes');
  const imagenes = useNative('imagenes');
  const audio = useNative('audio');
  const [estado, setEstado] = useState<EstadoHilo>({ tipo: 'cargando' });
  const [servidor, setServidor] = useState<IResponseMensaje[]>([]);
  const [pendientes, setPendientes] = useState<IPendiente[]>([]);
  const [texto, setTexto] = useState('');
  const [seleccionId, setSeleccionId] = useState<number | null>(null);
  const [grabacion, setGrabacion] = useState<EstadoGrabacion>({
    tipo: 'inactiva',
  });
  const grabando = useRef(false);
  const montado = useRef(true);
  const listo = useRef(false);
  const sondeando = useRef(false);
  const marcando = useRef(false);
  const eligiendo = useRef(false);
  const contador = useRef(0);
  const servidorRef = useRef<IResponseMensaje[]>([]);
  servidorRef.current = servidor;
  const alLeerRef = useRef(alLeer);
  alLeerRef.current = alLeer;

  const _cargar = useCallback(async () => {
    listo.current = false;
    setEstado({ tipo: 'cargando' });
    const r = await obtenerHiloUseCase(repo, { idEstudiante, despuesDe: 0 });
    if (!montado.current) {
      return;
    }
    if (r.error || !r.response) {
      setEstado({
        tipo: 'error',
        msg: textoDeError(r.msg),
      });
      return;
    }
    listo.current = true;
    setServidor(combinarHilo([], r.response.mensajes, r.response.estados));
    setEstado({ tipo: 'listo' });
  }, [repo, idEstudiante]);

  useEffect(() => {
    montado.current = true;
    _cargar();
    return () => {
      montado.current = false;
    };
  }, [_cargar]);

  // Sondeo: solo mensajes con id mayor al último y el estado de los últimos. Un fallo se calla:
  // el siguiente intento lo recupera y no se llena la pantalla de avisos.
  const sondear = useCallback(async () => {
    if (sondeando.current || !listo.current) {
      return;
    }
    sondeando.current = true;
    const r = await obtenerHiloUseCase(repo, {
      idEstudiante,
      despuesDe: ultimoIdServidor(servidorRef.current),
    });
    sondeando.current = false;
    if (montado.current && !r.error && r.response) {
      const { mensajes, estados } = r.response;
      setServidor(s => combinarHilo(s, mensajes, estados));
    }
  }, [repo, idEstudiante]);

  useEffect(() => {
    if (!activo) {
      return undefined;
    }
    const intervalo = setInterval(sondear, INTERVALO_SONDEO_HILO_MS);
    return () => clearInterval(intervalo);
  }, [activo, sondear]);

  // Lo que el otro lado escribió se marca como leído mientras el hilo está abierto.
  const sinLeer = noLeidosDelOtro(servidor);
  useEffect(() => {
    if (!activo || sinLeer === 0 || marcando.current) {
      return;
    }
    marcando.current = true;
    marcarLeidoUseCase(repo, idEstudiante).then(r => {
      marcando.current = false;
      if (montado.current && !r.error) {
        setServidor(s => s.map(m => (m.mio ? m : { ...m, leido: true })));
        alLeerRef.current?.();
      }
    });
  }, [activo, sinLeer, repo, idEstudiante]);

  const enviarContenido = useCallback(
    async (
      contenido: string,
      { imagen, voz, duracionMs }: IAdjunto = {},
      claveExistente?: number,
    ) => {
      const clave = claveExistente ?? ++contador.current;
      const creado = marcaDeInstante(ahora());
      setPendientes(p => [
        ...p.filter(x => x.clave !== clave),
        {
          clave,
          texto: contenido,
          imagen,
          voz,
          duracionMs,
          envio: 'enviando',
          creado,
        },
      ]);
      const r = await enviarMensajeUseCase(repo, {
        idEstudiante,
        texto: contenido,
        imagen,
        voz,
      });
      if (!montado.current) {
        return;
      }
      if (r.error || !r.response) {
        setPendientes(p =>
          p.map(x => (x.clave === clave ? { ...x, envio: 'fallido' } : x)),
        );
        notify.error(mensajesChat.noSeEnvio, textoDeError(r.msg));
        return;
      }
      const enviado = r.response;
      if (imagen || voz) {
        recordarMedia(repo, enviado.id, {
          imagen: imagen ?? null,
          voz: voz ?? null,
          duracionMs,
        });
      }
      setPendientes(p => p.filter(x => x.clave !== clave));
      setServidor(s => combinarHilo(s, [enviado]));
    },
    [repo, idEstudiante, ahora],
  );

  const _enviar = useCallback(async () => {
    const problema = problemaDelTexto(texto);
    if (problema === 'largo') {
      notify.error(mensajesChat.noSeEnvio, mensajesChat.textoLargo(2000));
      return;
    }
    if (problema) {
      return;
    }
    const contenido = texto.trim();
    setTexto('');
    await enviarContenido(contenido);
  }, [texto, enviarContenido]);

  const _adjuntarImagen = useCallback(
    async (origen: OrigenFoto) => {
      if (eligiendo.current) {
        return;
      }
      eligiendo.current = true;
      const foto = await imagenes.elegir(origen);
      eligiendo.current = false;
      if (!montado.current || foto.tipo === 'cancelado') {
        return;
      }
      if (foto.tipo === 'error') {
        notify.error(mensajesChat.noSePudoFoto, foto.msg);
        return;
      }
      if (foto.dataUrl.length > MAX_IMAGEN) {
        notify.error(mensajesChat.noSeEnvio, mensajesChat.imagenGrande);
        return;
      }
      const pie = texto.trim();
      setTexto('');
      await enviarContenido(pie, { imagen: foto.dataUrl });
    },
    [imagenes, texto, enviarContenido],
  );

  const _cancelarGrabacion = useCallback(async () => {
    if (!grabando.current) {
      return;
    }
    grabando.current = false;
    setGrabacion({ tipo: 'inactiva' });
    await audio.cancelarGrabacion();
  }, [audio]);

  const _enviarGrabacion = useCallback(async () => {
    if (!grabando.current) {
      return;
    }
    grabando.current = false;
    setGrabacion({ tipo: 'inactiva' });
    const r = await audio.terminarGrabacion();
    if (!montado.current) {
      return;
    }
    if (r.tipo === 'error') {
      notify.error(mensajesChat.noSePudoGrabar, r.msg);
      return;
    }
    if (r.duracionMs < MIN_GRABACION_MS) {
      notify.error(mensajesChat.noSeEnvio, mensajesChat.vozCorta);
      return;
    }
    if (r.dataUrl.length > MAX_VOZ) {
      notify.error(mensajesChat.noSeEnvio, mensajesChat.vozGrande);
      return;
    }
    await enviarContenido('', { voz: r.dataUrl, duracionMs: r.duracionMs });
  }, [audio, enviarContenido]);

  const enviarGrabacionRef = useRef(_enviarGrabacion);
  enviarGrabacionRef.current = _enviarGrabacion;

  const _grabar = useCallback(async () => {
    if (grabando.current) {
      return;
    }
    grabando.current = true;
    const r = await audio.empezarGrabacion(ms => {
      if (!montado.current || !grabando.current) {
        return;
      }
      setGrabacion({ tipo: 'grabando', ms });
      // A los 2 minutos la nota se corta y se envía sola.
      if (ms >= MAX_GRABACION_MS) {
        enviarGrabacionRef.current();
      }
    });
    if (!montado.current) {
      return;
    }
    if (r.tipo !== 'ok') {
      grabando.current = false;
      notify.error(
        mensajesChat.noSePudoGrabar,
        r.tipo === 'denegado' ? mensajesChat.sinMicrofono : r.msg,
      );
      return;
    }
    setGrabacion({ tipo: 'grabando', ms: 0 });
  }, [audio]);

  // Salir del hilo con una grabación abierta la descarta.
  useEffect(
    () => () => {
      if (grabando.current) {
        grabando.current = false;
        audio.cancelarGrabacion();
      }
    },
    [audio],
  );

  const _reintentar = useCallback(
    async (clave: number) => {
      const p = pendientes.find(x => x.clave === clave);
      if (p && p.envio === 'fallido') {
        await enviarContenido(
          p.texto,
          { imagen: p.imagen, voz: p.voz, duracionMs: p.duracionMs },
          clave,
        );
      }
    },
    [pendientes, enviarContenido],
  );

  const _descartar = useCallback((clave: number) => {
    setPendientes(p => p.filter(x => x.clave !== clave));
  }, []);

  const mensajes = useMemo<IMensajeChat[]>(
    () => [
      ...servidor.map(m => ({ ...m, envio: 'enviado' as const })),
      ...pendientes.map(p => ({
        id: -p.clave,
        idEstudiante,
        remitente:
          rol === 'profe' ? ('teacher' as const) : ('student' as const),
        nombre: null,
        texto: p.texto,
        tieneImagen: Boolean(p.imagen),
        imagenLocal: p.imagen,
        tieneVoz: Boolean(p.voz),
        vozLocal: p.voz,
        duracionVozMs: p.duracionMs,
        leido: false,
        editado: false,
        reacciones: {},
        creado: p.creado,
        mio: true,
        envio: p.envio,
      })),
    ],
    [servidor, pendientes, idEstudiante, rol],
  );

  const seleccion = useMemo(
    () => mensajes.find(m => m.id === seleccionId) ?? null,
    [mensajes, seleccionId],
  );

  const _abrirReacciones = useCallback((id: number) => {
    // Solo mensajes que ya están en el servidor admiten reacción.
    if (id > 0) {
      setSeleccionId(id);
    }
  }, []);
  const _cerrarReacciones = useCallback(() => setSeleccionId(null), []);

  const _reaccionar = useCallback(
    async (emoji: string) => {
      const id = seleccionId;
      setSeleccionId(null);
      if (id === null) {
        return;
      }
      const r = await reaccionarUseCase(repo, { id, emoji });
      if (!montado.current) {
        return;
      }
      if (r.error || !r.response) {
        notify.error(mensajesChat.noSeActualizo, textoDeError(r.msg));
        return;
      }
      const reacciones = r.response;
      setServidor(s => s.map(m => (m.id === id ? { ...m, reacciones } : m)));
    },
    [repo, seleccionId],
  );

  return {
    estado,
    mensajes,
    texto,
    seleccion,
    grabacion,
    _cargar,
    _cambiarTexto: setTexto,
    _enviar,
    _adjuntarImagen,
    _grabar,
    _cancelarGrabacion,
    _enviarGrabacion,
    _reintentar,
    _descartar,
    _abrirReacciones,
    _cerrarReacciones,
    _reaccionar,
  };
}
