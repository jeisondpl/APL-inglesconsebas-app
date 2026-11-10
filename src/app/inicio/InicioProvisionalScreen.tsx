import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entorno } from '@/shared/lib/entorno';

import { displayName } from '../../../app.json';
import { version } from '../../../package.json';
import { textosInicio as textos } from './inicio.textos';

/**
 * Host (con puerto) de una URL. Se extrae con una expresión regular porque el `URL` de React
 * Native no implementa todas sus propiedades.
 */
function hostDe(url: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url)?.[1] ?? url;
}

/**
 * Pantalla inicial provisional, con primitivas de React Native y los colores del tema de
 * navegación. Muestra el nombre, la versión de package.json y el entorno de react-native-config.
 * La sustituye la feature de sesión.
 */
export function InicioProvisionalScreen() {
  const { colors } = useTheme();
  const colorTexto = { color: colors.text };
  return (
    <SafeAreaView
      style={[estilos.pantalla, { backgroundColor: colors.background }]}
    >
      <Text accessibilityRole="header" style={[estilos.titulo, colorTexto]}>
        {displayName}
      </Text>
      <Text style={[estilos.subtitulo, colorTexto]}>{textos.subtitulo}</Text>
      <View style={estilos.datos}>
        <Text style={[estilos.dato, colorTexto]}>
          {textos.version(version)}
        </Text>
        <Text style={[estilos.dato, colorTexto]}>
          {textos.entorno(entorno.appEnv)}
        </Text>
        <Text style={[estilos.dato, colorTexto]}>
          {textos.servidor(hostDe(entorno.apiUrl))}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  titulo: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitulo: { fontSize: 15, textAlign: 'center' },
  datos: { alignItems: 'center', gap: 4, marginTop: 12 },
  dato: { fontSize: 13 },
});
