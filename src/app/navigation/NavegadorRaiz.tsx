import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef } from 'react';
import { StatusBar } from 'react-native';

import { useNative } from '@/app/di';
import { textosEscaparate } from '@/app/escaparate/escaparate.textos';
import { SistemaDisenoScreen } from '@/app/escaparate/SistemaDisenoScreen';
import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { useArranqueOnboarding } from '@/modules/onboarding/aplications/controllers/Onboarding.controller';
import { pantallasOnboarding } from '@/modules/onboarding/presentation/navigation';
import { useArranqueSesion } from '@/modules/sesion/aplications/controllers/Sesion.controller';
import { pantallasAuth } from '@/modules/sesion/presentation/navigation';
import { useTema } from '@/shared/theme';

import { PestanasEstudiante } from './PestanasEstudiante';
import { rutaInicialRaiz } from './rutaInicialRaiz';
import { rutaInicioPorRol } from './rutaInicioPorRol';
import { temaNavegacion } from './temaNavegacion';
import type { RaizParamList } from './tipos';

const Pila = createNativeStackNavigator<RaizParamList>();

/**
 * Navegador raíz (docs/ARQUITECTURA.md § 7). Mientras se restauran la sesión y la bandera de la
 * bienvenida no pinta nada y el splash nativo sigue visible (las dos lecturas corren en paralelo).
 * Después elige el flujo por estado: App (inicio por rol: las pestañas del estudiante, F1-05, o el
 * inicio provisional de profe y admin) si hay sesión, la bienvenida (EXT-01) si
 * toca y, si no, Auth (login). Cambiar de flujo es cambiar de estado, sin `navigate` imperativo,
 * así que el botón atrás no vuelve del inicio al login ni del login a la bienvenida.
 */
export function NavegadorRaiz() {
  const { tema } = useTema();
  const temaNav = useMemo(() => temaNavegacion(tema), [tema]);
  const splash = useNative('splash');
  const estado = useArranqueSesion();
  const onboarding = useArranqueOnboarding(estado.tipo === 'autenticado');
  const splashOculto = useRef(false);
  // El splash nativo se oculta con fundido cuando la navegación está lista, una sola vez.
  const alEstarLista = useCallback(() => {
    if (!splashOculto.current) {
      splashOculto.current = true;
      splash.ocultar({ fundido: true });
    }
  }, [splash]);

  if (estado.tipo === 'restaurando' || onboarding.tipo === 'cargando') {
    return null;
  }
  const rutaInicial = rutaInicialRaiz({ estadoSesion: estado, onboarding });
  const rutaInicio =
    estado.tipo === 'autenticado'
      ? rutaInicioPorRol(estado.sesion.usuario.rol)
      : null;

  return (
    <NavigationContainer theme={temaNav} onReady={alEstarLista}>
      <StatusBar barStyle={temaNav.dark ? 'light-content' : 'dark-content'} />
      <Pila.Navigator
        initialRouteName={rutaInicial}
        screenOptions={{ headerShown: false }}
      >
        {rutaInicio ? (
          <Pila.Group>
            {/* F1-05: el estudiante entra a sus pestañas; profe y admin, al inicio provisional. */}
            <Pila.Screen
              name={rutaInicio}
              component={
                rutaInicio === 'InicioEstudiante'
                  ? PestanasEstudiante
                  : InicioProvisionalScreen
              }
            />
            {__DEV__ ? (
              <Pila.Screen
                name="SistemaDiseno"
                component={SistemaDisenoScreen}
                options={{ headerShown: true, title: textosEscaparate.titulo }}
              />
            ) : null}
          </Pila.Group>
        ) : rutaInicial === 'Onboarding' ? (
          <Pila.Group>{pantallasOnboarding(Pila)}</Pila.Group>
        ) : (
          // Al terminar la bienvenida su grupo desaparece y queda Login como única ruta (sin
          // regreso). Se anima como un avance, no como un «pop» (R3).
          <Pila.Group screenOptions={{ animationTypeForReplace: 'push' }}>
            {pantallasAuth(Pila)}
          </Pila.Group>
        )}
      </Pila.Navigator>
    </NavigationContainer>
  );
}
