import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef } from 'react';
import { StatusBar } from 'react-native';

import { useNative } from '@/app/di';
import { textosEscaparate } from '@/app/escaparate/escaparate.textos';
import { SistemaDisenoScreen } from '@/app/escaparate/SistemaDisenoScreen';
import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { useTema } from '@/shared/theme';

import { temaNavegacion } from './temaNavegacion';
import type { RaizParamList } from './tipos';

const Pila = createNativeStackNavigator<RaizParamList>();

/** Navegador raíz. Compone los navegadores de los módulos (docs/ARQUITECTURA.md § 7). */
export function NavegadorRaiz() {
  const { tema } = useTema();
  const temaNav = useMemo(() => temaNavegacion(tema), [tema]);
  const splash = useNative('splash');
  const splashOculto = useRef(false);
  // El splash nativo se oculta con fundido cuando la navegación está lista, una sola vez.
  const alEstarLista = useCallback(() => {
    if (!splashOculto.current) {
      splashOculto.current = true;
      splash.ocultar({ fundido: true });
    }
  }, [splash]);
  return (
    <NavigationContainer theme={temaNav} onReady={alEstarLista}>
      <StatusBar barStyle={temaNav.dark ? 'light-content' : 'dark-content'} />
      <Pila.Navigator
        initialRouteName="InicioProvisional"
        screenOptions={{ headerShown: false }}
      >
        <Pila.Screen
          name="InicioProvisional"
          component={InicioProvisionalScreen}
        />
        <Pila.Screen
          name="SistemaDiseno"
          component={SistemaDisenoScreen}
          options={{ headerShown: true, title: textosEscaparate.titulo }}
        />
      </Pila.Navigator>
    </NavigationContainer>
  );
}
