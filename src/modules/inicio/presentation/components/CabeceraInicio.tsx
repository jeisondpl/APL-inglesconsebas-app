import { Pressable, StyleSheet, View } from 'react-native';

import { LogoMarca } from '@/shared/components/LogoMarca';
import { Texto } from '@/shared/components/Texto';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { inicialDe } from '../../domain/validations/inicio.validations';
import { textosInicio as textos } from '../inicio.textos';

export interface IPropsCabeceraInicio {
  nombre: string;
  /** «Plan Progress · ciclo 15 sep – 14 oct», o `null` mientras no se sabe. */
  subtitulo: string | null;
  alAbrirCuenta: () => void;
}

const LADO_AVATAR = 36;

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.m,
      paddingTop: 18,
      paddingBottom: tema.espaciado.m,
    },
    textos: { flex: 1 },
    toque: {
      width: tema.toqueMinimo,
      height: tema.toqueMinimo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: LADO_AVATAR,
      height: LADO_AVATAR,
      borderRadius: LADO_AVATAR / 2,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.destacado,
      borderColor: tema.colores.bordeDestacado,
    },
    pulsado: { opacity: 0.8 },
  });

/** Cabecera A-M2: isotipo, saludo, plan con el ciclo y avatar con la inicial (abre la cuenta). */
export function CabeceraInicio({
  nombre,
  subtitulo,
  alAbrirCuenta,
}: IPropsCabeceraInicio) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.cabecera}>
      <LogoMarca
        tamano={38}
        categoria={tema.modo === 'oscuro' ? 'kids' : 'corporate'}
      />
      <View style={estilos.textos}>
        <Texto variante="titulo" accessibilityRole="header" numberOfLines={1}>
          {textos.saludo(nombre)}
        </Texto>
        {subtitulo ? (
          <Texto variante="detalle" color="textoSecundario" numberOfLines={1}>
            {subtitulo}
          </Texto>
        ) : null}
      </View>
      <Pressable
        testID="avatar-cuenta"
        accessibilityRole="button"
        accessibilityLabel={textos.abrirCuenta}
        onPress={alAbrirCuenta}
        style={({ pressed }) => [estilos.toque, pressed && estilos.pulsado]}
      >
        <View style={estilos.avatar}>
          <Texto variante="subtitulo" color="sobreExitoSuave">
            {inicialDe(nombre)}
          </Texto>
        </View>
      </Pressable>
    </View>
  );
}
