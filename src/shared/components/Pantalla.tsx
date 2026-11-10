import type { ReactNode } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useEstilos, useTema, type ITema } from '@/shared/theme';

export interface IPropsPantalla {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView. */
  desplazable?: boolean;
  /** Bordes con inset (R8: edge-to-edge con targetSdk 36). Por defecto, los cuatro. */
  bordes?: Edge[];
  /** Estilo del contenido (padding, alineación…). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: { flexGrow: 1, padding: tema.espaciado.xxl },
  });

const TODOS: Edge[] = ['top', 'right', 'bottom', 'left'];

/** Contenedor de pantalla: insets de área segura, fondo del tema y StatusBar acorde al modo. */
export function Pantalla({
  children,
  desplazable = false,
  bordes = TODOS,
  style,
  testID,
}: IPropsPantalla) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  return (
    <SafeAreaView testID={testID} edges={bordes} style={estilos.pantalla}>
      <StatusBar
        barStyle={tema.modo === 'oscuro' ? 'light-content' : 'dark-content'}
      />
      {desplazable ? (
        <ScrollView contentContainerStyle={[estilos.contenido, style]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[estilos.contenido, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
