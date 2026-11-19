import { StyleSheet, View } from 'react-native';

import {
  useEstilos,
  useTema,
  type IColoresTema,
  type ITema,
} from '@/shared/theme';

import { Boton } from './Boton';
import { Texto } from './Texto';

export type TonoAviso = 'error' | 'aviso' | 'exito' | 'info';

export interface IPropsAvisoEnLinea {
  titulo: string;
  mensaje?: string;
  /** error se anuncia como alerta; el resto, como texto. */
  tono?: TonoAviso;
  /** Acción opcional, p. ej. «Reintentar» en un error de carga. */
  accion?: { titulo: string; onPress: () => void };
  testID?: string;
}

const coloresPorTono: Record<
  TonoAviso,
  {
    fondo: keyof IColoresTema;
    borde: keyof IColoresTema;
    texto: keyof IColoresTema;
  }
> = {
  error: {
    fondo: 'peligroSuave',
    borde: 'bordePeligro',
    texto: 'sobrePeligroSuave',
  },
  aviso: { fondo: 'avisoSuave', borde: 'avisoSuave', texto: 'sobreAvisoSuave' },
  exito: { fondo: 'exitoSuave', borde: 'exitoSuave', texto: 'sobreExitoSuave' },
  info: { fondo: 'superficieAlterna', borde: 'borde', texto: 'texto' },
};

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    aviso: {
      borderWidth: 1,
      borderRadius: tema.radios.tarjeta,
      padding: 14,
      gap: tema.espaciado.s,
    },
    accion: { alignSelf: 'flex-start' },
  });

/**
 * Aviso persistente dentro de la pantalla (errores de carga, avisos). El resultado de una mutación
 * va por `notify`, no por aquí (docs/ARQUITECTURA.md § 8).
 */
export function AvisoEnLinea({
  titulo,
  mensaje,
  tono = 'info',
  accion,
  testID,
}: IPropsAvisoEnLinea) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const c = coloresPorTono[tono];
  return (
    <View
      testID={testID}
      style={[
        estilos.aviso,
        {
          backgroundColor: tema.colores[c.fondo],
          borderColor: tema.colores[c.borde],
        },
      ]}
    >
      <View
        accessible
        accessibilityRole={tono === 'error' ? 'alert' : 'text'}
        accessibilityLiveRegion={tono === 'error' ? 'assertive' : 'none'}
      >
        <Texto variante="subtitulo" color={c.texto}>
          {titulo}
        </Texto>
        {mensaje ? (
          <Texto variante="detalle" color={c.texto}>
            {mensaje}
          </Texto>
        ) : null}
      </View>
      {accion ? (
        <Boton
          variante="secundario"
          titulo={accion.titulo}
          onPress={accion.onPress}
          style={estilos.accion}
        />
      ) : null}
    </View>
  );
}
