import { StyleSheet, View } from 'react-native';

import { Boton } from '@/shared/components/Boton';
import { Insignia } from '@/shared/components/Insignia';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { IconoFlecha } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';
import { Pressable } from 'react-native';

import type {
  ICicloClases,
  IClaseHistorial,
} from '../../domain/entities/Clases.entities';
import {
  estadoVisible,
  puedeIntentarCancelar,
  puedeIntentarReagendar,
} from '../../domain/validations/clases.validations';
import { textosClases as textos } from '../clases.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    flecha: {
      width: tema.toqueMinimo,
      height: tema.toqueMinimo,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tema.radios.pildora,
      borderWidth: 1,
      borderColor: tema.colores.borde,
    },
    inactiva: { opacity: 0.35 },
    centro: { flex: 1, alignItems: 'center' },
    resumen: { flexDirection: 'row', flexWrap: 'wrap', gap: tema.espaciado.s },
    dato: {
      flexGrow: 1,
      flexBasis: '45%',
      borderRadius: tema.radios.tarjeta,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      backgroundColor: tema.colores.superficie,
      paddingVertical: tema.espaciado.s,
      paddingHorizontal: tema.espaciado.m,
    },
    lista: { gap: 10 },
    fila: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    fecha: { width: 52, alignItems: 'center' },
    medio: { flex: 1, minWidth: 0, gap: 2 },
    derecha: { alignItems: 'flex-end', gap: tema.espaciado.xs },
    botones: {
      flexDirection: 'row',
      gap: tema.espaciado.s,
      marginTop: tema.espaciado.s,
    },
    botonFila: { flex: 1, paddingHorizontal: tema.espaciado.s },
  });

/** Selector del ciclo: flechas para ir a los anteriores y el rango de fechas en el centro. */
export function SelectorCiclo({
  ciclo,
  posicion,
  total,
  alAnterior,
  alSiguiente,
}: {
  ciclo: ICicloClases;
  posicion: number;
  total: number;
  alAnterior: () => void;
  alSiguiente: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const hayAnterior = posicion < total - 1;
  const haySiguiente = posicion > 0;
  return (
    <View
      style={estilos.selector}
      testID="selector-ciclo"
      accessible
      accessibilityLabel={textos.ciclo.accesible(ciclo, posicion, total)}
    >
      <Pressable
        testID="ciclo-anterior"
        accessibilityRole="button"
        accessibilityLabel={textos.ciclo.anterior}
        accessibilityState={{ disabled: !hayAnterior }}
        disabled={!hayAnterior}
        onPress={alAnterior}
        style={[estilos.flecha, !hayAnterior && estilos.inactiva]}
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconoFlecha tamano={16} color={tema.colores.texto} />
        </View>
      </Pressable>
      <View style={estilos.centro}>
        <Texto variante="etiqueta" color="marca">
          {textos.ciclo.etiqueta(ciclo)}
        </Texto>
        <Texto variante="subtitulo">{textos.ciclo.rango(ciclo)}</Texto>
      </View>
      <Pressable
        testID="ciclo-siguiente"
        accessibilityRole="button"
        accessibilityLabel={textos.ciclo.siguiente}
        accessibilityState={{ disabled: !haySiguiente }}
        disabled={!haySiguiente}
        onPress={alSiguiente}
        style={[estilos.flecha, !haySiguiente && estilos.inactiva]}
      >
        <IconoFlecha tamano={16} color={tema.colores.texto} />
      </Pressable>
    </View>
  );
}

/** Cuatro totales del ciclo: tomadas, programadas, por reagendar y canceladas. */
export function ResumenCiclo({ ciclo }: { ciclo: ICicloClases }) {
  const estilos = useEstilos(crearEstilos);
  const r = ciclo.resumen;
  const datos: [string, number][] = [
    [textos.resumen.tomadas, r.tomadas],
    [textos.resumen.programadas, r.programadas],
    [textos.resumen.porReagendar, r.porReagendar],
    [textos.resumen.canceladas, r.canceladas],
  ];
  return (
    <View style={estilos.resumen} testID="resumen-ciclo">
      {datos.map(([etiqueta, valor]) => (
        <View
          key={etiqueta}
          style={estilos.dato}
          accessible
          accessibilityLabel={`${etiqueta}: ${valor}`}
        >
          <Texto variante="h2">{String(valor)}</Texto>
          <Texto variante="detalle" color="textoSecundario">
            {etiqueta}
          </Texto>
        </View>
      ))}
    </View>
  );
}

function FilaClase({
  clase,
  esProxima,
  puedeCancelar,
  puedeReagendar,
  alAbrirZoom,
  alCancelar,
  alReagendar,
}: {
  clase: IClaseHistorial;
  esProxima: boolean;
  puedeCancelar: boolean;
  puedeReagendar: boolean;
  alAbrirZoom: (enlace: string) => void;
  alCancelar: (idClase: string) => void;
  alReagendar: (idClase: string) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const estado = estadoVisible(clase.estado);
  const detalle = textos.clase.detalle(clase);
  return (
    <View
      testID={`clase-${clase.id}`}
      accessible
      accessibilityLabel={textos.clase.accesible(clase, estado.etiqueta)}
    >
      <Tarjeta variante={esProxima ? 'destacada' : 'normal'}>
        <View style={estilos.fila}>
          <View style={estilos.fecha}>
            <Texto variante="cuerpoFuerte">
              {textos.clase.dia(clase.fecha)}
            </Texto>
            <Texto variante="detalle" color="textoSecundario">
              {textos.clase.mes(clase.fecha)}
            </Texto>
          </View>
          <View style={estilos.medio}>
            <Texto variante="cuerpoFuerte">
              {textos.clase.hora(clase.hora)}
            </Texto>
            {detalle ? (
              <Texto
                variante="detalle"
                color="textoSecundario"
                numberOfLines={2}
              >
                {detalle}
              </Texto>
            ) : null}
          </View>
          <View style={estilos.derecha}>
            {esProxima ? (
              <Insignia tono="exito" texto={textos.clase.proxima} />
            ) : null}
            <Insignia tono={estado.tono} texto={estado.etiqueta} />
          </View>
        </View>
        {(esProxima && clase.enlaceZoom) || puedeCancelar || puedeReagendar ? (
          <View style={estilos.botones}>
            {esProxima && clase.enlaceZoom ? (
              <Boton
                titulo={textos.clase.abrirZoom}
                accessibilityHint={textos.clase.abrirZoomAyuda}
                onPress={() => alAbrirZoom(clase.enlaceZoom as string)}
                style={estilos.botonFila}
              />
            ) : null}
            {puedeReagendar ? (
              <Boton
                testID={`reagendar-${clase.id}`}
                titulo={textos.reagendar.boton}
                accessibilityLabel={textos.reagendar.botonAyuda(clase)}
                onPress={() => alReagendar(clase.id)}
                style={estilos.botonFila}
              />
            ) : null}
            {puedeCancelar ? (
              <Boton
                testID={`cancelar-${clase.id}`}
                variante="secundario"
                titulo={textos.cancelar.boton}
                accessibilityLabel={textos.cancelar.botonAyuda(clase)}
                onPress={() => alCancelar(clase.id)}
                style={estilos.botonFila}
              />
            ) : null}
          </View>
        ) : null}
      </Tarjeta>
    </View>
  );
}

/** Todas las clases del ciclo por fecha, con la próxima destacada y su Zoom. */
export function ListaClases({
  ciclo,
  ahoraMs,
  alAbrirZoom,
  alCancelar,
  alReagendar,
}: {
  ciclo: ICicloClases;
  ahoraMs: number;
  alAbrirZoom: (enlace: string) => void;
  alCancelar: (idClase: string) => void;
  alReagendar: (idClase: string) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  if (ciclo.clases.length === 0) {
    return (
      <Tarjeta testID="ciclo-vacio">
        <Texto variante="detalle" color="textoSecundario">
          {textos.vacioCiclo}
        </Texto>
      </Tarjeta>
    );
  }
  return (
    <View style={estilos.lista} testID="lista-clases">
      {ciclo.clases.map(c => (
        <FilaClase
          key={c.id}
          clase={c}
          esProxima={c.id === ciclo.proximaId}
          puedeCancelar={puedeIntentarCancelar(c, ahoraMs)}
          puedeReagendar={puedeIntentarReagendar(c)}
          alAbrirZoom={alAbrirZoom}
          alCancelar={alCancelar}
          alReagendar={alReagendar}
        />
      ))}
    </View>
  );
}
