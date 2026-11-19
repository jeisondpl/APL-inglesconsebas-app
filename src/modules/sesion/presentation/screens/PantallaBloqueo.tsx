import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, LogoMarca, Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { useBloqueoController } from '../../aplications/controllers/Bloqueo.controller';
import { textosSesion } from '../sesion.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: {
      ...StyleSheet.absoluteFill,
      zIndex: 100,
      backgroundColor: tema.colores.fondo,
    },
    centro: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxl,
      gap: tema.espaciado.l,
    },
    ayuda: { textAlign: 'center' },
    acciones: { alignSelf: 'stretch', gap: tema.espaciado.m },
  });

export interface IPropsPantallaBloqueo {
  /** Sale de la cuenta: salida cuando la biometría no sirve. */
  alCerrarSesion: () => void;
}

/**
 * La app está tapada hasta que la persona se verifique con su huella o rostro (F1-03b, 1.13). Se
 * pinta encima del navegador, que conserva su estado. Si no pasa, puede reintentar o cerrar sesión.
 */
export function PantallaBloqueo({ alCerrarSesion }: IPropsPantallaBloqueo) {
  const estilos = useEstilos(crearEstilos);
  const c = useBloqueoController();
  return (
    <SafeAreaView
      style={estilos.pantalla}
      testID="pantalla-bloqueo"
      accessibilityViewIsModal
    >
      <View style={estilos.centro}>
        <LogoMarca tamano={96} />
        <Texto variante="h1" accessibilityRole="header">
          {textosSesion.bloqueo.titulo}
        </Texto>
        <Texto color="textoSecundario" style={estilos.ayuda}>
          {c.falloVerificacion
            ? textosSesion.bloqueo.fallo
            : textosSesion.bloqueo.ayuda}
        </Texto>
        <View style={estilos.acciones}>
          <Boton
            testID="bloqueo-reintentar"
            titulo={textosSesion.bloqueo.desbloquear}
            onPress={() => {
              c._desbloquear();
            }}
            cargando={c.verificando}
          />
          <Boton
            testID="bloqueo-cerrar-sesion"
            variante="secundario"
            titulo={textosSesion.bloqueo.cerrarSesion}
            onPress={alCerrarSesion}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
