import { useCallback, useEffect, useRef, useState } from 'react';

import { useRepository } from '@/app/di';
import { notify } from '@/shared/lib/notify';

import type {
  IResponseMediaTarea,
  IResponseTarea,
  SlotTarea,
} from '../../domain/entities/Tareas.entities';
import { mensajesTareas } from '../../domain/tareas.mensajes';
import {
  entregarTareaUseCase,
  marcarFeedbackVistoUseCase,
  obtenerMediaTareaUseCase,
  revisarTareaUseCase,
} from '../tareas/tareas';
import { useGrabadora, type IGrabadoraController } from './Audio.controller';

export type EstadoMediaTarea =
  | { tipo: 'sin' }
  | { tipo: 'cargando' }
  | { tipo: 'error'; msg: string }
  | { tipo: 'listo'; media: IResponseMediaTarea };

export interface IMediaTareaController {
  estado: EstadoMediaTarea;
  _reintentar(): Promise<void>;
}

/** Voz e imágenes de una parte de la tarea, bajadas al mostrarse (la lista no las trae). */
export function useMediaTarea(
  id: number,
  slot: SlotTarea,
  activo: boolean,
): IMediaTareaController {
  const repo = useRepository('tareas');
  const [estado, setEstado] = useState<EstadoMediaTarea>({
    tipo: activo ? 'cargando' : 'sin',
  });
  const montado = useRef(true);

  const _reintentar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    const r = await obtenerMediaTareaUseCase(repo, id, slot);
    if (!montado.current) {
      return;
    }
    setEstado(
      r.error || !r.response
        ? { tipo: 'error', msg: r.msg ?? '' }
        : { tipo: 'listo', media: r.response },
    );
  }, [repo, id, slot]);

  useEffect(() => {
    montado.current = true;
    if (activo) {
      _reintentar();
    }
    return () => {
      montado.current = false;
    };
  }, [activo, _reintentar]);

  return { estado: activo ? estado : { tipo: 'sin' }, _reintentar };
}

export interface IDetalleTareaController {
  instruccion: IMediaTareaController;
  entrega: IMediaTareaController;
  feedback: IMediaTareaController;
  /** El estudiante puede entregar o reentregar (mientras no esté revisada). */
  puedeEntregar: boolean;
  /** La profe puede revisar (la tarea ya está entregada). */
  puedeRevisar: boolean;
  texto: string;
  comentario: string;
  nota: string;
  grabadora: IGrabadoraController;
  enviando: boolean;
  _cambiarTexto(t: string): void;
  _cambiarComentario(t: string): void;
  _cambiarNota(t: string): void;
  _enviar(): Promise<void>;
}

/**
 * Detalle de una tarea (F3-02): la consigna, la entrega y el feedback con su contenido, y el
 * formulario según el rol. El estudiante entrega con texto y/o audio (3.8) y ve el feedback (3.9),
 * que al abrirse se marca como visto; la profe revisa con comentario, nota y/o audio (3.10).
 */
export function useDetalleTareaController(
  tarea: IResponseTarea,
  rol: 'estudiante' | 'profe',
  alCambio: () => void,
): IDetalleTareaController {
  const repo = useRepository('tareas');
  const grabadora = useGrabadora();
  const [texto, setTexto] = useState(tarea.entrega ?? '');
  const [comentario, setComentario] = useState(tarea.comentario ?? '');
  const [nota, setNota] = useState(tarea.nota ?? '');
  const [enviando, setEnviando] = useState(false);
  const montado = useRef(true);
  const visto = useRef(false);

  const instruccion = useMediaTarea(
    tarea.id,
    'instruccion',
    tarea.tieneVozInstruccion || tarea.imagenesInstruccion > 0,
  );
  const entrega = useMediaTarea(
    tarea.id,
    'entrega',
    tarea.tieneVozEntrega || tarea.imagenesEntrega > 0,
  );
  const feedback = useMediaTarea(tarea.id, 'feedback', tarea.tieneVozFeedback);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // El estudiante que abre una tarea revisada ya vio su feedback.
  const debeMarcarVisto =
    rol === 'estudiante' && tarea.estado === 'reviewed' && !tarea.feedbackVisto;
  useEffect(() => {
    if (!debeMarcarVisto || visto.current) {
      return;
    }
    visto.current = true;
    marcarFeedbackVistoUseCase(repo, tarea.id).then(r => {
      if (!r.error && montado.current) {
        alCambio();
      }
    });
  }, [debeMarcarVisto, repo, tarea.id, alCambio]);

  const _enviar = useCallback(async () => {
    if (enviando) {
      return;
    }
    setEnviando(true);
    const voz = grabadora.voz?.dataUrl;
    const r =
      rol === 'estudiante'
        ? await entregarTareaUseCase(repo, { id: tarea.id, texto, voz })
        : await revisarTareaUseCase(repo, {
            id: tarea.id,
            comentario,
            nota,
            voz,
          });
    if (!montado.current) {
      return;
    }
    setEnviando(false);
    if (r.error) {
      notify.error(mensajesTareas.noSeEnvio, r.msg);
      return;
    }
    grabadora._descartarVoz();
    notify.success(
      rol === 'estudiante'
        ? mensajesTareas.entregaEnviada
        : mensajesTareas.feedbackEnviado,
    );
    alCambio();
  }, [
    enviando,
    grabadora,
    rol,
    repo,
    tarea.id,
    texto,
    comentario,
    nota,
    alCambio,
  ]);

  return {
    instruccion,
    entrega,
    feedback,
    puedeEntregar: rol === 'estudiante' && tarea.estado !== 'reviewed',
    puedeRevisar: rol === 'profe' && tarea.estado !== 'pending',
    texto,
    comentario,
    nota,
    grabadora,
    enviando,
    _cambiarTexto: setTexto,
    _cambiarComentario: setComentario,
    _cambiarNota: setNota,
    _enviar,
  };
}
