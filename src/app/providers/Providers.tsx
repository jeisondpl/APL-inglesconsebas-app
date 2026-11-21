import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider, type IDependencias } from '@/app/di';
import { HostNotificaciones } from '@/shared/components';
import { TemaProvider, type PreferenciaTema } from '@/shared/theme';

import { ConBannerConexion } from '@/app/conexion/BannerConexion';

import { LimiteDeErrores } from './LimiteDeErrores';
import { TemaPersistente } from './TemaPersistente';

interface IPropsProviders {
  children: ReactNode;
  /** Contenedor de dependencias. Los tests pasan uno con falsos. */
  dependencias?: IDependencias;
  /** Preferencia de tema inicial. Por defecto, PREFERENCIA_TEMA_POR_DEFECTO. */
  preferenciaTema?: PreferenciaTema;
}

/**
 * Providers globales, de fuera hacia dentro: SafeArea, tema, dependencias y límite de errores. El
 * host de toasts va dentro del tema, como hermano del resto, para pintarse encima de todo.
 */
export function Providers({
  children,
  dependencias,
  preferenciaTema,
}: IPropsProviders) {
  return (
    <SafeAreaProvider>
      <TemaProvider preferenciaInicial={preferenciaTema}>
        <DependenciasProvider valor={dependencias}>
          <TemaPersistente />
          <ConBannerConexion>
            <LimiteDeErrores>{children}</LimiteDeErrores>
          </ConBannerConexion>
        </DependenciasProvider>
        <HostNotificaciones />
      </TemaProvider>
    </SafeAreaProvider>
  );
}
