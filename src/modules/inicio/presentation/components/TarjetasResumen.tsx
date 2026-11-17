import { StyleSheet, View } from 'react-native';

import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { useEstilos, type ITema } from '@/shared/theme';

import type {
  ICancelaciones,
  IProgresoCiclo,
} from '../../domain/entities/Inicio.entities';
import { textosInicio } from '../inicio.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    tarjeta: { flex: 1, gap: tema.espaciado.xs },
    valor: { marginTop: tema.espaciado.xs },
    pista: {
      height: 6,
      marginTop: 5,
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.pista,
      overflow: 'hidden',
    },
    relleno: {
      height: '100%',
      borderRadius: tema.radios.pildora,
      backgroundColor: tema.colores.marca,
    },
  });

/** Tarjeta CICLO: «6 de 12 clases» con barra de progreso (pista + marca). */
export function TarjetaCiclo({ progreso }: { progreso: IProgresoCiclo }) {
  const estilos = useEstilos(crearEstilos);
  const textos = textosInicio.ciclo;
  return (
    <Tarjeta style={estilos.tarjeta} testID="tarjeta-ciclo">
      <Texto variante="etiqueta" color="textoSecundario">
        {textos.etiqueta}
      </Texto>
      <Texto variante="subtitulo" style={estilos.valor}>
        {textos.progreso(progreso)}
      </Texto>
      {progreso.total !== null ? (
        <View
          style={estilos.pista}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={textos.accesible(progreso)}
          accessibilityValue={{
            min: 0,
            max: progreso.total,
            now: Math.min(progreso.tomadas, progreso.total),
          }}
        >
          <View
            testID="relleno-ciclo"
            style={[
              estilos.relleno,
              { width: `${Math.round(progreso.fraccion * 100)}%` },
            ]}
          />
        </View>
      ) : null}
    </Tarjeta>
  );
}

/** Tarjeta CANCELACIONES: «2 de 3» y la antelación con la que hay que avisar. */
export function TarjetaCancelaciones({
  cancelaciones,
}: {
  cancelaciones: ICancelaciones;
}) {
  const estilos = useEstilos(crearEstilos);
  const textos = textosInicio.cancelaciones;
  const incluidas = cancelaciones.maximas > 0;
  return (
    <Tarjeta
      style={estilos.tarjeta}
      testID="tarjeta-cancelaciones"
      accessibilityLabel={
        incluidas ? textos.accesible(cancelaciones) : undefined
      }
    >
      <Texto variante="etiqueta" color="textoSecundario">
        {textos.etiqueta}
      </Texto>
      {incluidas ? (
        <>
          <Texto variante="subtitulo" style={estilos.valor}>
            {textos.disponibles(cancelaciones)}
          </Texto>
          <Texto variante="detalle" color="textoSecundario">
            {textos.aviso(cancelaciones)}
          </Texto>
        </>
      ) : (
        <Texto variante="detalle" color="textoSecundario" style={estilos.valor}>
          {textos.sinCancelaciones}
        </Texto>
      )}
    </Tarjeta>
  );
}
