import { createContext, useContext, useMemo, type ReactNode } from 'react';

import {
  crearDependencias,
  type IDependencias,
  type INativos,
  type IRepositorios,
} from './contenedor';

const ContextoDependencias = createContext<IDependencias | null>(null);

interface IPropsDependenciasProvider {
  /** Contenedor a usar. Los tests pasan uno con falsos; si se omite, se crea el real. */
  valor?: IDependencias;
  children: ReactNode;
}

export function DependenciasProvider({
  valor,
  children,
}: IPropsDependenciasProvider) {
  const dependencias = useMemo(() => valor ?? crearDependencias(), [valor]);
  return (
    <ContextoDependencias.Provider value={dependencias}>
      {children}
    </ContextoDependencias.Provider>
  );
}

function useDependencias(gancho: string): IDependencias {
  const dependencias = useContext(ContextoDependencias);
  if (!dependencias) {
    throw new Error(
      `${gancho} se usó fuera de <DependenciasProvider>. Envuelve la app con los providers de src/app/providers.`,
    );
  }
  return dependencias;
}

/** Devuelve el repositorio registrado con `clave` en el contenedor. */
export function useRepository<K extends keyof IRepositorios>(
  clave: K,
): IRepositorios[K] {
  const { repositorios } = useDependencias('useRepository');
  if (!(clave in repositorios)) {
    throw new Error(
      `useRepository: no hay ningún repositorio registrado con la clave «${String(
        clave,
      )}» en src/app/di/contenedor.ts.`,
    );
  }
  return repositorios[clave];
}

/** Devuelve el adaptador nativo registrado con `clave` en el contenedor. */
export function useNative<K extends keyof INativos>(clave: K): INativos[K] {
  const { nativos } = useDependencias('useNative');
  if (!(clave in nativos)) {
    throw new Error(
      `useNative: no hay ningún adaptador nativo registrado con la clave «${String(
        clave,
      )}» en src/app/di/contenedor.ts.`,
    );
  }
  return nativos[clave];
}
