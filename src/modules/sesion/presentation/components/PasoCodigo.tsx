import { StyleSheet, View } from 'react-native';

import { Boton, Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';
import { PuntosPin } from './PuntosPin';
import { TecladoPin } from './TecladoPin';

const textos = textosSesion.codigo;

export interface IPropsPasoCodigo {
  correoEnmascarado: string;
  escritos: number;
  total: number;
  /** Segundos para poder reenviar (0 = ya se puede). */
  reenviarEn: number;
  error: string | null;
  cargando: boolean;
  alPulsarDigito: (digito: string) => void;
  alBorrar: () => void;
  alConfirmar: () => void;
  alReenviar: () => void;
  alVolver: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    paso: { gap: tema.espaciado.l },
    estado: {
      minHeight: tema.espaciado.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centrado: { textAlign: 'center' },
    acciones: { flexDirection: 'row', gap: tema.espaciado.m },
    accion: { flex: 1 },
  });

/**
 * Paso 3 del login (F1-06, doble factor): el código de 6 dígitos que llegó por correo. Reutiliza
 * los puntos y el teclado del PIN; se envía solo al último dígito. «Reenviar» espera la cuenta
 * atrás del servidor.
 */
export function PasoCodigo({
  correoEnmascarado,
  escritos,
  total,
  reenviarEn,
  error,
  cargando,
  alPulsarDigito,
  alBorrar,
  alConfirmar,
  alReenviar,
  alVolver,
}: IPropsPasoCodigo) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.paso}>
      <View>
        <Texto variante="h2" accessibilityRole="header">
          {textos.titulo}
        </Texto>
        <Texto color="textoSecundario">
          {textos.subtitulo(correoEnmascarado)}
        </Texto>
      </View>
      <PuntosPin
        escritos={escritos}
        total={total}
        conError={Boolean(error) && !cargando}
        etiqueta={textos.puntos(escritos, total)}
      />
      <View style={estilos.estado}>
        {error && !cargando ? (
          <Texto
            variante="detalle"
            color="peligro"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            style={estilos.centrado}
          >
            {error}
          </Texto>
        ) : (
          <Texto variante="detalle" color="textoTenue" style={estilos.centrado}>
            {textos.pista}
          </Texto>
        )}
      </View>
      <TecladoPin
        alPulsarDigito={alPulsarDigito}
        alBorrar={alBorrar}
        alConfirmar={alConfirmar}
        confirmarActivo={escritos === total}
        deshabilitado={cargando}
      />
      <View style={estilos.acciones}>
        <Boton
          variante="secundario"
          titulo={textos.volver}
          onPress={alVolver}
          deshabilitado={cargando}
          style={estilos.accion}
        />
        <Boton
          variante="secundario"
          titulo={
            reenviarEn > 0 ? textos.reenviarEn(reenviarEn) : textos.reenviar
          }
          onPress={alReenviar}
          deshabilitado={cargando || reenviarEn > 0}
          style={estilos.accion}
          testID="reenviar-codigo"
        />
      </View>
    </View>
  );
}
