import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { Boton, Marca, Pantalla, Texto } from '@/shared/components';
import { entorno } from '@/shared/lib/entorno';

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
 * Pantalla inicial provisional con el sistema de diseño: la marca, la versión de package.json y el
 * entorno de react-native-config, y el acceso al escaparate del sistema de diseño. La sustituye la
 * feature de sesión.
 */
export function InicioProvisionalScreen() {
  const navegacion = useNavigation();
  return (
    <Pantalla style={estilos.contenido}>
      <Marca esEncabezado />
      <Texto color="textoSecundario" style={estilos.centrado}>
        {textos.subtitulo}
      </Texto>
      <View style={estilos.datos}>
        <Texto variante="detalle" color="textoSecundario">
          {textos.version(version)}
        </Texto>
        <Texto variante="detalle" color="textoSecundario">
          {textos.entorno(entorno.appEnv)}
        </Texto>
        <Texto variante="detalle" color="textoSecundario">
          {textos.servidor(hostDe(entorno.apiUrl))}
        </Texto>
      </View>
      <Boton
        variante="secundario"
        titulo={textos.verSistemaDiseno}
        onPress={() => navegacion.navigate('SistemaDiseno')}
      />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenido: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  centrado: { textAlign: 'center' },
  datos: { alignItems: 'center', gap: 4, marginTop: 8 },
});
