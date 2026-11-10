import Toast from 'react-native-toast-message';

import { textosComunes } from './textos';
import { mensajeDeError } from './utils';

/** Tipos de aviso. `warning` lo registra el host en src/app (la librería solo trae success, error e info). */
export type TipoAviso = 'success' | 'error' | 'warning' | 'info';

type Mostrar = (titulo: string, detalle?: string) => void;

const mostrar =
  (tipo: TipoAviso): Mostrar =>
  (titulo, detalle) => {
    Toast.show({ type: tipo, text1: titulo, text2: detalle });
  };

/**
 * Fachada única de toasts (docs/ARQUITECTURA.md § 8). Es para el resultado de las mutaciones: las
 * vistas no importan la librería directamente.
 */
export const notify: {
  success: Mostrar;
  error: Mostrar;
  warning: Mostrar;
  info: Mostrar;
  /** Muestra un error con el mensaje legible de `err` (HttpResponse, Error o valor desconocido). */
  fromError(err: unknown, titulo: string): void;
} = {
  success: mostrar('success'),
  error: mostrar('error'),
  warning: mostrar('warning'),
  info: mostrar('info'),
  fromError(err, titulo) {
    mostrar('error')(
      titulo,
      mensajeDeError(err, textosComunes.errores.desconocido),
    );
  },
};
