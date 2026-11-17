import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef } from 'react';
import { StatusBar } from 'react-native';

import { useNative } from '@/app/di';
import { textosEscaparate } from '@/app/escaparate/escaparate.textos';
import { SistemaDisenoScreen } from '@/app/escaparate/SistemaDisenoScreen';
import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { useArranqueSesion } from '@/modules/sesion/aplications/controllers/Sesion.controller';
import {
  pantallasAuth,
  rutaInicialAuth,
} from '@/modules/sesion/presentation/navigation';
import { useTema } from '@/shared/theme';

import { rutaInicioPorRol } from './rutaInicioPorRol';
import { temaNavegacion } from './temaNavegacion';
import type { RaizParamList } from './tipos';

const Pila = createNativeStackNavigator<RaizParamList>();

/**
 * Navegador raíz (docs/ARQUITECTURA.md § 7). Mientras se restaura la sesión no pinta nada y el
 * splash nativo sigue visible. Después elige el flujo según la sesión: Auth (login) o App (inicio
 * por rol). Cambiar de flujo es cambiar de estado, sin `navigate` imperativo, así que el botón
 * atrás no vuelve del inicio al login.
 */
export function NavegadorRaiz() {
  const { tema } = useTema();
  const temaNav = useMemo(() => temaNavegacion(tema), [tema]);
  const splash = useNative('splash');
  const estado = useArranqueSesion();
  const splashOculto = useRef(false);
  // El splash nativo se oculta con fundido cuando la navegación está lista, una sola vez.
  const alEstarLista = useCallback(() => {
    if (!splashOculto.current) {
      splashOculto.current = true;
      splash.ocultar({ fundido: true });
    }
  }, [splash]);

  if (estado.tipo === 'restaurando') {
    return null;
  }
  const autenticado = estado.tipo === 'autenticado';
  const rutaInicio = autenticado
    ? rutaInicioPorRol(estado.sesion.usuario.rol)
    : rutaInicialAuth();

  return (
    <NavigationContainer theme={temaNav} onReady={alEstarLista}>
      <StatusBar barStyle={temaNav.dark ? 'light-content' : 'dark-content'} />
      <Pila.Navigator
        initialRouteName={rutaInicio}
        screenOptions={{ headerShown: false }}
      >
        {autenticado ? (
          <Pila.Group>
            <Pila.Screen
              name={rutaInicio}
              component={InicioProvisionalScreen}
            />
            {__DEV__ ? (
              <Pila.Screen
                name="SistemaDiseno"
                component={SistemaDisenoScreen}
                options={{ headerShown: true, title: textosEscaparate.titulo }}
              />
            ) : null}
          </Pila.Group>
        ) : (
          <Pila.Group>{pantallasAuth(Pila)}</Pila.Group>
        )}
      </Pila.Navigator>
    </NavigationContainer>
  );
}
