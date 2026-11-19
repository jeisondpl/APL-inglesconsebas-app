import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  PREFERENCIA_TEMA_POR_DEFECTO,
  temas,
  type ITema,
  type ModoTema,
  type PreferenciaTema,
} from './temas';

export interface IContextoTema {
  tema: ITema;
  preferencia: PreferenciaTema;
  establecerPreferencia(preferencia: PreferenciaTema): void;
}

const ContextoTema = createContext<IContextoTema | null>(null);

/** Modo efectivo: con `sistema` sigue al esquema del sistema y, si no informa, usa oscuro. */
function resolverModo(
  preferencia: PreferenciaTema,
  esquema: string | null | undefined,
): ModoTema {
  if (preferencia !== 'sistema') {
    return preferencia;
  }
  return esquema === 'light' ? 'claro' : 'oscuro';
}

interface IPropsTemaProvider {
  children: ReactNode;
  /** Preferencia con la que arranca. Por defecto, PREFERENCIA_TEMA_POR_DEFECTO. */
  preferenciaInicial?: PreferenciaTema;
}

/**
 * Proveedor del tema. La preferencia vive en memoria: guardarla entre arranques es el ítem 1.14.
 */
export function TemaProvider({
  children,
  preferenciaInicial = PREFERENCIA_TEMA_POR_DEFECTO,
}: IPropsTemaProvider) {
  const esquema = useColorScheme();
  const [preferencia, establecerPreferencia] =
    useState<PreferenciaTema>(preferenciaInicial);
  const modo = resolverModo(preferencia, esquema);
  const valor = useMemo<IContextoTema>(
    () => ({ tema: temas[modo], preferencia, establecerPreferencia }),
    [modo, preferencia],
  );
  return (
    <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
  );
}

/** Tema actual, preferencia y cómo cambiarla. Lanza un error descriptivo fuera de TemaProvider. */
export function useTema(): IContextoTema {
  const contexto = useContext(ContextoTema);
  if (!contexto) {
    throw new Error(
      'useTema se usó fuera de <TemaProvider>. Envuelve la app con los providers de src/app/providers.',
    );
  }
  return contexto;
}
