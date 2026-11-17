import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** Pestañas del estudiante (F1-05). */
export type PestanaEstudiante = 'inicio' | 'clases' | 'mensajes' | 'tareas';

export interface IContextoPestanas {
  activa: PestanaEstudiante;
  irAPestana: (pestana: PestanaEstudiante) => void;
}

const Contexto = createContext<IContextoPestanas | null>(null);

/** Patrón de Livic (`TabNavigationContext`): cualquier pantalla puede cambiar de pestaña. */
export function ProveedorPestanas({
  activa,
  irAPestana,
  children,
}: IContextoPestanas & { children: ReactNode }) {
  const valor = useMemo(() => ({ activa, irAPestana }), [activa, irAPestana]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePestanas(): IContextoPestanas {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error(
      'usePestanas se usó fuera de <ProveedorPestanas> (src/app/navigation/PestanasEstudiante).',
    );
  }
  return valor;
}
