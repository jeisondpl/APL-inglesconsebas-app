import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRepository } from '@/app/di';

import type {
  IResponseListaTareas,
  IResponseTarea,
  SeccionTareas,
} from '../../domain/entities/Tareas.entities';
import {
  seccionDe,
  tareasDeSeccion,
} from '../../domain/validations/tareas.validations';
import { obtenerTareasUseCase } from '../tareas/tareas';

export type EstadoTareas =
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; lista: IResponseListaTareas };

export interface ITareasController {
  estado: EstadoTareas;
  refrescando: boolean;
  seccion: SeccionTareas;
  /** Secciones que se ofrecen, en orden (el estudiante ve tres; la profe, dos). */
  secciones: SeccionTareas[];
  /** Cuántas tareas hay en cada sección (para el chip). */
  conteo: Record<SeccionTareas, number>;
  /** Tareas de la sección activa, ya ordenadas. */
  visibles: IResponseTarea[];
  /** La tarea abierta (siempre la versión más reciente de la lista) o `null`. */
  abierta: IResponseTarea | null;
  ahoraMs: number;
  _cargar(): Promise<void>;
  _refrescar(): Promise<void>;
  _elegirSeccion(s: SeccionTareas): void;
  _abrir(id: number): void;
  _cerrar(): void;
}

const SECCIONES: Record<'estudiante' | 'profe', SeccionTareas[]> = {
  estudiante: ['pendientes', 'porRevisar', 'revisadas'],
  profe: ['porRevisar', 'pendientes', 'revisadas'],
};

/**
 * Lista de tareas (F3-02, 3.7 y 3.10): el estudiante ve las suyas y la profe las de sus estudiantes.
 * La profe entra en «por revisar» (lo que le toca); el estudiante, en «pendientes».
 */
export function useTareasController(
  rol: 'estudiante' | 'profe',
  ahora: () => number = Date.now,
): ITareasController {
  const repo = useRepository('tareas');
  const [estado, setEstado] = useState<EstadoTareas>({ tipo: 'cargando' });
  const [refrescando, setRefrescando] = useState(false);
  const [seccion, setSeccion] = useState<SeccionTareas>(SECCIONES[rol][0]);
  const [idAbierta, setIdAbierta] = useState<number | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const pedir = useCallback(async (): Promise<EstadoTareas> => {
    const r = await obtenerTareasUseCase(repo);
    if (r.error || !r.response) {
      return { tipo: 'error', msg: r.msg ?? '' };
    }
    return { tipo: 'listo', lista: r.response };
  }, [repo]);

  const _cargar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const e = await pedir();
    if (montado.current) {
      setEstado(e);
    }
  }, [pedir]);

  const _refrescar = useCallback(async () => {
    setRefrescando(true);
    const e = await pedir();
    if (montado.current) {
      // Un fallo al refrescar no borra lo que ya se ve.
      setEstado(actual =>
        e.tipo === 'error' && actual.tipo === 'listo' ? actual : e,
      );
      setRefrescando(false);
    }
  }, [pedir]);

  useEffect(() => {
    _cargar();
  }, [_cargar]);

  const tareas = useMemo(
    () => (estado.tipo === 'listo' ? estado.lista.tareas : []),
    [estado],
  );
  const conteo = useMemo(() => {
    const c: Record<SeccionTareas, number> = {
      pendientes: 0,
      porRevisar: 0,
      revisadas: 0,
    };
    tareas.forEach(t => {
      c[seccionDe(t)] += 1;
    });
    return c;
  }, [tareas]);
  const visibles = useMemo(
    () => tareasDeSeccion(tareas, seccion),
    [tareas, seccion],
  );
  const abierta = tareas.find(t => t.id === idAbierta) ?? null;

  return {
    estado,
    refrescando,
    seccion,
    secciones: SECCIONES[rol],
    conteo,
    visibles,
    abierta,
    ahoraMs: ahora(),
    _cargar,
    _refrescar,
    _elegirSeccion: setSeccion,
    _abrir: setIdAbierta,
    _cerrar: () => setIdAbierta(null),
  };
}
