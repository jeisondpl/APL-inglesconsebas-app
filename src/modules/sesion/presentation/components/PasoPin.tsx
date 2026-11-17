import { Pressable, StyleSheet, View } from 'react-native';

import { Boton, Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';
import { PuntosPin } from './PuntosPin';
import { TecladoPin } from './TecladoPin';

const textos = textosSesion.pin;

export interface IPropsPasoPin {
  usuario: string;
  escritos: number;
  total: number;
  error: string | null;
  cargando: boolean;
  alPulsarDigito: (digito: string) => void;
  alBorrar: () => void;
  alConfirmar: () => void;
  alVolver: () => void;
  alAyuda: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    paso: { gap: tema.espaciado.l },
    estado: {
      minHeight: tema.espaciado.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { textAlign: 'center' },
    enlace: {
      minHeight: tema.toqueMinimo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    enlaceTexto: { textAlign: 'center', textDecorationLine: 'underline' },
  });

/**
 * Paso 2 del login: «PIN para <usuario>», puntos, teclado, volver y ayuda por WhatsApp. Un error
 * nuevo sacude los puntos (F1-04).
 */
export function PasoPin({
  usuario,
  escritos,
  total,
  error,
  cargando,
  alPulsarDigito,
  alBorrar,
  alConfirmar,
  alVolver,
  alAyuda,
}: IPropsPasoPin) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.paso}>
      <View>
        <Texto variante="h2" accessibilityRole="header">
          {textos.titulo(usuario)}
        </Texto>
        <Texto color="textoSecundario">{textos.subtitulo}</Texto>
      </View>
      <PuntosPin
        escritos={escritos}
        total={total}
        conError={Boolean(error) && !cargando}
      />
      {/* Mientras se verifica, la carga la pinta LoginScreen encima de la tarjeta (PulsoCarga). */}
      <View style={estilos.estado}>
        {error && !cargando ? (
          <Texto
            variante="detalle"
            color="peligro"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            style={estilos.error}
          >
            {error}
          </Texto>
        ) : null}
      </View>
      <TecladoPin
        alPulsarDigito={alPulsarDigito}
        alBorrar={alBorrar}
        alConfirmar={alConfirmar}
        confirmarActivo={escritos === total}
        deshabilitado={cargando}
      />
      <Boton
        variante="secundario"
        titulo={textos.volverAlUsuario}
        onPress={alVolver}
        deshabilitado={cargando}
      />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={textos.ayuda}
        accessibilityHint={textos.ayudaPista}
        onPress={alAyuda}
        style={estilos.enlace}
      >
        <Texto variante="detalle" color="marca" style={estilos.enlaceTexto}>
          {textos.ayuda}
        </Texto>
      </Pressable>
    </View>
  );
}
