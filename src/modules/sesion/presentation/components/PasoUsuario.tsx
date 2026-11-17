import { StyleSheet, View } from 'react-native';

import { Boton, BotonGoogle, Campo, Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';

const textos = textosSesion.usuario;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    paso: { gap: tema.espaciado.l },
    separador: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.m,
    },
    linea: { flex: 1, height: 1, backgroundColor: tema.colores.borde },
  });

export interface IPropsPasoUsuario {
  usuario: string;
  error: string | null;
  alCambiar: (texto: string) => void;
  alContinuar: () => void;
  /** Sin esta prop (Google sin configurar en el build) no se muestra el botón de Google. */
  alContinuarConGoogle?: () => void;
  cargandoGoogle?: boolean;
}

/**
 * Paso 1 del login: el usuario, con su error de validación junto al campo, y «Continuar con
 * Google» debajo (F1-06). Un error de Google también se muestra en el campo.
 */
export function PasoUsuario({
  usuario,
  error,
  alCambiar,
  alContinuar,
  alContinuarConGoogle,
  cargandoGoogle = false,
}: IPropsPasoUsuario) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.paso}>
      <View>
        <Texto variante="h2" accessibilityRole="header">
          {textos.titulo}
        </Texto>
        <Texto color="textoSecundario">{textos.subtitulo}</Texto>
      </View>
      <Campo
        etiqueta={textos.etiqueta}
        valor={usuario}
        alCambiar={alCambiar}
        error={error ?? undefined}
        placeholder={textos.marcador}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={alContinuar}
      />
      <Boton
        titulo={textos.continuar}
        onPress={alContinuar}
        deshabilitado={cargandoGoogle}
      />
      {alContinuarConGoogle ? (
        <>
          <View style={estilos.separador} accessible={false}>
            <View style={estilos.linea} />
            <Texto variante="detalle" color="textoSecundario">
              {textos.o}
            </Texto>
            <View style={estilos.linea} />
          </View>
          <BotonGoogle
            onPress={alContinuarConGoogle}
            cargando={cargandoGoogle}
            testID="boton-google"
          />
        </>
      ) : null}
    </View>
  );
}
