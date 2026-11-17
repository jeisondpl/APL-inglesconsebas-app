import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSesionController } from '@/modules/sesion/aplications/controllers/Sesion.controller';
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
 * Inicio provisional de los tres roles (InicioEstudiante, InicioProfe e InicioAdmin): saludo con
 * el nombre, rol, versión, entorno y servidor, y «Cerrar sesión». El escaparate del sistema de
 * diseño solo aparece en desarrollo. Lo sustituye el inicio real de cada rol (ítem 1.17).
 */
export function InicioProvisionalScreen() {
  const navegacion = useNavigation();
  const { usuario, _cerrarSesion } = useSesionController();
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      await _cerrarSesion();
    } finally {
      setCerrando(false);
    }
  };

  return (
    <Pantalla desplazable style={estilos.contenido}>
      <Marca esEncabezado ancho={200} />
      {usuario ? (
        <View style={estilos.datos}>
          <Texto variante="h2" style={estilos.centrado}>
            {textos.saludo(usuario.nombre)}
          </Texto>
          <Texto color="textoSecundario">{textos.rol(usuario.rol)}</Texto>
        </View>
      ) : null}
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
        variante="peligro"
        titulo={textos.cerrarSesion}
        onPress={cerrarSesion}
        cargando={cerrando}
      />
      {__DEV__ ? (
        <Boton
          variante="secundario"
          titulo={textos.verSistemaDiseno}
          onPress={() => navegacion.navigate('SistemaDiseno')}
        />
      ) : null}
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenido: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  centrado: { textAlign: 'center' },
  datos: { alignItems: 'center', gap: 4 },
});
