import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme } from 'react-native';

import { InicioProvisionalScreen } from '@/app/inicio/InicioProvisionalScreen';

import { temaNavegacion } from './temaNavegacion';
import type { RaizParamList } from './tipos';

const Pila = createNativeStackNavigator<RaizParamList>();

/** Navegador raíz. Compone los navegadores de los módulos (docs/ARQUITECTURA.md § 7). */
export function NavegadorRaiz() {
  const tema = temaNavegacion(useColorScheme());
  return (
    <NavigationContainer theme={tema}>
      <StatusBar barStyle={tema.dark ? 'light-content' : 'dark-content'} />
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
