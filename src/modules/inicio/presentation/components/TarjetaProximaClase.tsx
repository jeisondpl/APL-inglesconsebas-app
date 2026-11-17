import { StyleSheet, View } from 'react-native';

import { Boton } from '@/shared/components/Boton';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { IconoReloj } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import type {
  CuentaAtras,
  IProximaClase,
} from '../../domain/entities/Inicio.entities';
import { textosInicio } from '../inicio.textos';

const textos = textosInicio.proximaClase;

export interface IPropsTarjetaProximaClase {
  clase: IProximaClase | null;
  cuentaAtras: CuentaAtras | null;
  ahoraMs: number;
  alIrAClase: (enlace: string) => void;
  alReagendar: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tema.espaciado.s,
    },
    pildora: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: tema.radios.pildora,
      paddingHorizontal: 10,
      paddingVertical: tema.espaciado.xs,
      backgroundColor: tema.colores.exitoSuave,
    },
    cuando: { marginTop: tema.espaciado.xs },
    botones: {
      flexDirection: 'row',
      gap: 10,
      marginTop: tema.espaciado.s,
    },
    boton: { flex: 1, paddingHorizontal: tema.espaciado.s },
  });

/** Tarjeta destacada «PRÓXIMA CLASE» (A-M2) o su estado vacío honesto. */
export function TarjetaProximaClase({
  clase,
  cuentaAtras,
  ahoraMs,
  alIrAClase,
  alReagendar,
}: IPropsTarjetaProximaClase) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);

  if (!clase) {
    return (
      <Tarjeta variante="destacada" testID="proxima-clase-vacia">
        <Texto variante="etiqueta" color="marca">
          {textos.etiqueta}
        </Texto>
        <Texto variante="titulo">{textos.vacioTitulo}</Texto>
        <Texto variante="detalle" color="textoSecundario">
          {textos.vacioMensaje}
        </Texto>
      </Tarjeta>
    );
  }

  const detalle = textos.detalle(
    clase.profe,
    clase.duracionMin,
    Boolean(clase.enlaceZoom),
  );
  const enlace = clase.enlaceZoom;

  return (
    <Tarjeta variante="destacada" testID="proxima-clase">
      <View style={estilos.fila}>
        <Texto variante="etiqueta" color="marca" accessibilityRole="header">
          {textos.etiqueta}
        </Texto>
        {cuentaAtras ? (
          <View style={estilos.pildora} testID="cuenta-atras">
            <IconoReloj
              tamano={12}
              grosor={2}
              color={tema.colores.sobreExitoSuave}
            />
            <Texto variante="insignia" color="sobreExitoSuave">
              {textos.cuentaAtras(cuentaAtras)}
            </Texto>
          </View>
        ) : null}
      </View>
      <Texto variante="h2" style={estilos.cuando}>
        {textos.cuando(clase.fecha, clase.hora, ahoraMs)}
      </Texto>
      {detalle ? (
        <Texto variante="detalle" color="textoSecundario">
          {clase.reagendada ? `${textos.reagendada} · ${detalle}` : detalle}
        </Texto>
      ) : null}
      {enlace ? null : (
        <Texto variante="detalle" color="textoSecundario">
          {textos.sinEnlace}
        </Texto>
      )}
      <View style={estilos.botones}>
        {enlace ? (
          <Boton
            titulo={textos.irAMiClase}
            accessibilityHint={textos.irAMiClaseAyuda}
            onPress={() => alIrAClase(enlace)}
            style={estilos.boton}
          />
        ) : null}
        <Boton
          variante="secundario"
          titulo={textos.reagendar}
          onPress={alReagendar}
          style={estilos.boton}
        />
      </View>
    </Tarjeta>
  );
}
