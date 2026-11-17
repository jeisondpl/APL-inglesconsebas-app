import type { ComponentType } from 'react';

import { IlustracionBienvenida } from './components/IlustracionBienvenida';
import { IlustracionClases } from './components/ilustraciones/IlustracionClases';
import { IlustracionMensajes } from './components/ilustraciones/IlustracionMensajes';
import { IlustracionTareas } from './components/ilustraciones/IlustracionTareas';
import { textosOnboarding } from './onboarding.textos';

export interface IPaginaOnboarding {
  clave: 'bienvenida' | 'clases' | 'mensajes' | 'tareas';
  titulo: string;
  descripcion: string;
  Ilustracion: ComponentType;
}

const { paginas } = textosOnboarding;

/**
 * Páginas O1–O4 de la bienvenida, en orden. Textos e ilustraciones van en este arreglo, separado
 * del componente, como pide la nota del lienzo (CA15).
 */
export const PAGINAS_ONBOARDING: readonly IPaginaOnboarding[] = [
  {
    clave: 'bienvenida',
    ...paginas.bienvenida,
    Ilustracion: IlustracionBienvenida,
  },
  { clave: 'clases', ...paginas.clases, Ilustracion: IlustracionClases },
  { clave: 'mensajes', ...paginas.mensajes, Ilustracion: IlustracionMensajes },
  { clave: 'tareas', ...paginas.tareas, Ilustracion: IlustracionTareas },
];
