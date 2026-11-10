import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { displayName } from '../../../app.json';

/**
 * Pantalla inicial provisional, con primitivas de React Native y los colores del tema de
 * navegación. La sustituye la feature de sesión.
 */
export function InicioProvisionalScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[estilos.pantalla, { backgroundColor: colors.background }]}
    >
      <Text
        accessibilityRole="header"
        style={[estilos.titulo, { color: colors.text }]}
      >
        {displayName}
      </Text>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  titulo: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
});
