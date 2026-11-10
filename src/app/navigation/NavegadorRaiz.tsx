import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { StatusBar } from 'react-native';

import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';
import { useTema } from '@/shared/theme';

import { temaNavegacion } from './temaNavegacion';
import type { RaizParamList } from './tipos';

const Pila = createNativeStackNavigator<RaizParamList>();

/** Navegador raíz. Compone los navegadores de los módulos (docs/ARQUITECTURA.md § 7). */
export function NavegadorRaiz() {
  const { tema } = useTema();
  const temaNav = useMemo(() => temaNavegacion(tema), [tema]);
  return (
    <NavigationContainer theme={temaNav}>
      <StatusBar barStyle={temaNav.dark ? 'light-content' : 'dark-content'} />
      <Pila.Navigator
        initialRouteName="InicioProvisional"
        screenOptions={{ headerShown: false }}
      >
        <Pila.Screen
          name="InicioProvisional"
          component={InicioProvisionalScreen}
        />
      </Pila.Navigator>
    </NavigationContainer>
  );
}
