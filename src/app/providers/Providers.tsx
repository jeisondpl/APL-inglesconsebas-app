import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';

import { LimiteDeErrores } from './LimiteDeErrores';

interface IPropsProviders {
  children: ReactNode;
  /** Contenedor de dependencias. Los tests pasan uno con falsos. */
  dependencias?: IDependencias;
}

/** Providers globales, de fuera hacia dentro: SafeArea, dependencias y límite de errores. */
export function Providers({ children, dependencias }: IPropsProviders) {
  return (
    <SafeAreaProvider>
      <DependenciasProvider valor={dependencias}>
        <LimiteDeErrores>{children}</LimiteDeErrores>
      </DependenciasProvider>
    </SafeAreaProvider>
  );
}
