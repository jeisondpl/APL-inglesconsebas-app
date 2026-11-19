import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNative, useRepository } from '@/app/di';
import { hoyBogota } from '@/shared/lib/fechas';
import { notify } from '@/shared/lib/notify';
import { textosComunes } from '@/shared/lib/textos';

import { mensajesAgenda } from '../../domain/agenda.mensajes';
import type {
  IClaseAgenda,
  IDiaSemana,
  MarcaAsistencia,
} from '../../domain/entities/Agenda.entities';
import {
  clasesDelDia,
  clasesDelProfe,
  resumenSemana,
  sinMarcarAnteriores,
  sumarDias,
} from '../../domain/validations/agenda.validations';
import {
  marcarClaseUseCase,
  obtenerAgendaUseCase,
  type IDatosAgenda,
} from '../obtenerAgenda/obtenerAgenda';

/** Cada cuánto se recalcula el momento de las clases (sin volver a pedir datos). */
export const INTERVALO_RELOJ_AGENDA_MS = 60 * 1000;

export type VistaAgenda = 'dia' | 'semana';

export type EstadoAgenda =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; clases: IClaseAgenda[] };

/** La hoja de marcar: cerrada, o pidiendo confirmar «Realizada» / «No asistió». */
export type EstadoMarca =
  | { tipo: 'cerrada' }
  | {
      tipo: 'confirmar';
      clase: IClaseAgenda;
      marca: MarcaAsistencia;
      enviando: boolean;
      /** Error de la última confirmación (p. ej. la clase ya tenía marca). */
      error: string | null;
    };

export interface IAgendaController {
  estado: EstadoAgenda;
  vista: VistaAgenda;
  /** Día que se ve (o el de la semana que se ve). */
  fecha: string;
  hoy: string;
  refrescando: boolean;
  ahoraMs: number;
  /** Clases del día elegido. */
  delDia: IClaseAgenda[];
  /** Los siete días de la semana elegida. */
  semana: IDiaSemana[];
  /** Clases de días anteriores que siguen sin marca. */
  anteriores: IClaseAgenda[];
  marca: EstadoMarca;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
  _cambiarVista(vista: VistaAgenda): void;
  /** Abre un día en la vista Día. */
  _irADia(fecha: string): void;
  /** Un día (vista Día) o una semana (vista Semana) hacia atrás. */
  _anterior(): void;
  _siguiente(): void;
  _irAHoy(): void;
  _abrirZoom(enlace: string): Promise<void>;
  _pedirMarca(idClase: string, marca: MarcaAsistencia): void;
  _cancelarMarca(): void;
  _confirmarMarca(): Promise<void>;
}

export interface IOpcionesAgendaController {
  idProfe: string;
  /** Reloj inyectable (tests). */
  ahora?: () => number;
}

/**
 * Agenda del profe (F2-02): su horario por día y por semana, y marcar asistencia. Un refresco
 * fallido conserva lo que se ve y avisa con un toast.
 */
export function useAgendaController({
  idProfe,
  ahora = Date.now,
}: IOpcionesAgendaController): IAgendaController {
  const repo = useRepository('agenda');
  const enlaces = useNative('enlaces');
  const [datos, setDatos] = useState<
    | { tipo: 'cargando' }
    | { tipo: 'error'; msg: string }
    | { tipo: 'listo'; datos: IDatosAgenda }
  >({ tipo: 'cargando' });
  const [vista, setVista] = useState<VistaAgenda>('dia');
  const [fecha, setFecha] = useState(() => hoyBogota(ahora()));
  const [refrescando, setRefrescando] = useState(false);
  const [marca, setMarca] = useState<EstadoMarca>({ tipo: 'cerrada' });
  const [ahoraMs, setAhoraMs] = useState(ahora);
  const generacion = useRef(0);
  const montado = useRef(true);
  const yaListo = useRef(false);
  const marcando = useRef(false);
  const reloj = useRef(ahora);
  reloj.current = ahora;

  const leer = useCallback(async () => {
    const mia = ++generacion.current;
    const r = await obtenerAgendaUseCase(repo, { idProfe });
    if (mia !== generacion.current || !montado.current) {
      return;
    }
    setAhoraMs(reloj.current());
    if (r.error || !r.response) {
      const msg = r.msg ?? textosComunes.errores.desconocido;
      if (yaListo.current) {
        notify.error(mensajesAgenda.noSeActualizo, msg);
        return;
      }
      setDatos({ tipo: 'error', msg });
      return;
    }
    yaListo.current = true;
    setDatos({ tipo: 'listo', datos: r.response });
  }, [repo, idProfe]);

  const _cargar = useCallback(async () => {
    yaListo.current = false;
    setDatos({ tipo: 'cargando' });
    await leer();
  }, [leer]);

  const _refrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await leer();
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
    const intervalo = setInterval(
      () => setAhoraMs(reloj.current()),
      INTERVALO_RELOJ_AGENDA_MS,
    );
    return () => clearInterval(intervalo);
  }, []);

  const estado = useMemo<EstadoAgenda>(
    () =>
      datos.tipo === 'listo'
        ? {
            tipo: 'listo',
            clases: clasesDelProfe(
              datos.datos.clases,
              datos.datos.estudiantes,
              idProfe,
              ahoraMs,
              'Estudiante',
            ),
          }
        : datos,
    [datos, idProfe, ahoraMs],
  );
  const clases = useMemo(
    () => (estado.tipo === 'listo' ? estado.clases : []),
    [estado],
  );
  const delDia = useMemo(() => clasesDelDia(clases, fecha), [clases, fecha]);
  const semana = useMemo(
    () => resumenSemana(clases, fecha, ahoraMs),
    [clases, fecha, ahoraMs],
  );
  const anteriores = useMemo(
    () => sinMarcarAnteriores(clases, ahoraMs),
    [clases, ahoraMs],
  );

  const _cambiarVista = useCallback((v: VistaAgenda) => setVista(v), []);
  const _irADia = useCallback((f: string) => {
    setFecha(f);
    setVista('dia');
  }, []);
  const paso = vista === 'dia' ? 1 : 7;
  const _anterior = useCallback(
    () => setFecha(f => sumarDias(f, -paso)),
    [paso],
  );
  const _siguiente = useCallback(
    () => setFecha(f => sumarDias(f, paso)),
    [paso],
  );
  const _irAHoy = useCallback(() => setFecha(hoyBogota(reloj.current())), []);

  const _abrirZoom = useCallback(
    async (enlace: string) => {
      const abierto = await enlaces.abrir(enlace);
      if (!abierto) {
        notify.error(
          mensajesAgenda.noSeAbrioClase,
          mensajesAgenda.noSeAbrioClaseDetalle,
        );
      }
    },
    [enlaces],
  );

  const _pedirMarca = useCallback(
    (idClase: string, m: MarcaAsistencia) => {
      const clase = clases.find(c => c.id === idClase);
      if (clase) {
        setMarca({
          tipo: 'confirmar',
          clase,
          marca: m,
          enviando: false,
          error: null,
        });
      }
    },
    [clases],
  );

  const _cancelarMarca = useCallback(() => {
    // Mientras se envía no se cierra: no se sabría si la clase quedó marcada.
    setMarca(s =>
      s.tipo === 'confirmar' && s.enviando ? s : { tipo: 'cerrada' },
    );
  }, []);

  const _confirmarMarca = useCallback(async () => {
    if (marca.tipo !== 'confirmar' || marcando.current) {
      return;
    }
    const { clase, marca: eleccion } = marca;
    marcando.current = true;
    setMarca({ ...marca, enviando: true, error: null });
    const r = await marcarClaseUseCase(repo, {
      idClase: clase.id,
      marca: eleccion,
    });
    marcando.current = false;
    if (!montado.current) {
      return;
    }
    if (r.error || !r.response) {
      setMarca({
        tipo: 'confirmar',
        clase,
        marca: eleccion,
        enviando: false,
        error: r.msg ?? textosComunes.errores.desconocido,
      });
      // La clase pudo cambiar desde que se abrió la hoja (otra marca, otro dispositivo).
      await leer();
      return;
    }
    setMarca({ tipo: 'cerrada' });
    notify.success(
      eleccion === 'taken'
        ? mensajesAgenda.realizada
        : mensajesAgenda.noAsistio,
    );
    await leer();
  }, [marca, repo, leer]);

  return {
    estado,
    vista,
    fecha,
    hoy: hoyBogota(ahoraMs),
    refrescando,
    ahoraMs,
    delDia,
    semana,
    anteriores,
    marca,
    _cargar,
    _refrescar,
    _cambiarVista,
    _irADia,
    _anterior,
    _siguiente,
    _irAHoy,
    _abrirZoom,
    _pedirMarca,
    _cancelarMarca,
    _confirmarMarca,
  };
}
