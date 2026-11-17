import { StyleSheet, View } from 'react-native';

import { Boton, Campo, Texto } from '@/shared/components';

import { textosSesion } from '../sesion.textos';

const textos = textosSesion.usuario;

const estilos = StyleSheet.create({ paso: { gap: 16 } });

export interface IPropsPasoUsuario {
  usuario: string;
  error: string | null;
  alCambiar: (texto: string) => void;
  alContinuar: () => void;
}

/** Paso 1 del login: el usuario, con su error de validación junto al campo. */
export function PasoUsuario({
  usuario,
  error,
  alCambiar,
  alContinuar,
}: IPropsPasoUsuario) {
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
      <Boton titulo={textos.continuar} onPress={alContinuar} />
    </View>
  );
}
