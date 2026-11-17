import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Insignia } from '@/shared/components/Insignia';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { IconoFlecha, IconoTareas } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import type {
  IResponseMensaje,
  IResponseTarea,
} from '../../domain/entities/Inicio.entities';
import {
  estadoVencimiento,
  inicialDe,
} from '../../domain/validations/inicio.validations';
import { textosInicio } from '../inicio.textos';
import { TarjetaPulsable } from './TarjetaPulsable';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    seccion: { gap: tema.espaciado.s },
    encabezado: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: tema.espaciado.s,
    },
    lista: { gap: 10 },
    fila: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    caja: {
      width: 36,
      height: 36,
      borderRadius: tema.radios.icono,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.superficieAlterna,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: tema.radios.pildora,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.exitoSuave,
    },
    centro: { flex: 1, minWidth: 0, gap: 2 },
    lineaEntre: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tema.espaciado.s,
    },
    texto: { flexShrink: 1 },
  });

/** Encabezado de bloque: título y un dato a la derecha («2 por entregar»). */
export function EncabezadoSeccion({
  titulo,
  dato,
}: {
  titulo: string;
  dato?: string | null;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.encabezado}>
      <Texto variante="subtitulo" accessibilityRole="header">
        {titulo}
      </Texto>
      {dato ? (
        <Texto variante="detalle" color="textoSecundario">
          {dato}
        </Texto>
      ) : null}
    </View>
  );
}

/** Estado vacío honesto dentro de un bloque. */
export function VacioSeccion({
  texto,
  testID,
}: {
  texto: string;
  testID?: string;
}) {
  return (
    <Tarjeta testID={testID}>
      <Texto variante="detalle" color="textoSecundario">
        {texto}
      </Texto>
    </Tarjeta>
  );
}

export function SeccionTareas({
  lista,
  total,
  ahoraMs,
  alAbrir,
  aviso,
}: {
  lista: IResponseTarea[];
  total: number;
  ahoraMs: number;
  alAbrir: () => void;
  /** Aviso de error de la sección (sustituye a la lista). */
  aviso?: ReactNode;
}) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const textos = textosInicio.tareas;
  return (
    <View style={estilos.seccion} testID="seccion-tareas">
      <EncabezadoSeccion
        titulo={textos.titulo}
        dato={!aviso && total > 0 ? textos.porEntregar(total) : null}
      />
      {aviso ??
        (lista.length === 0 ? (
          <VacioSeccion texto={textos.vacio} testID="tareas-vacio" />
        ) : (
          <View style={estilos.lista}>
            {lista.map(tarea => {
              const titulo = tarea.titulo || textos.sinTitulo;
              const estado = estadoVencimiento(tarea.venceEl, ahoraMs);
              const vence = textos.vence(tarea.venceEl, estado);
              return (
                <TarjetaPulsable
                  key={tarea.id}
                  testID={`tarea-${tarea.id}`}
                  accessibilityLabel={
                    vence
                      ? `${textos.abrir(titulo)}. ${vence}`
                      : textos.abrir(titulo)
                  }
                  onPress={alAbrir}
                >
                  <View style={estilos.fila}>
                    <View style={estilos.caja}>
                      <IconoTareas tamano={18} color={tema.colores.marca} />
                    </View>
                    <View style={estilos.centro}>
                      <Texto variante="cuerpoFuerte" numberOfLines={1}>
                        {titulo}
                      </Texto>
                      {vence ? (
                        <Texto
                          variante="detalle"
                          color={estado === 'vencida' ? 'peligro' : 'aviso'}
                        >
                          {vence}
                        </Texto>
                      ) : null}
                    </View>
                    <IconoFlecha tamano={16} color={tema.colores.textoTenue} />
                  </View>
                </TarjetaPulsable>
              );
            })}
          </View>
        ))}
    </View>
  );
}

export function SeccionMensajes({
  ultimo,
  noLeidos,
  ahoraMs,
  alAbrir,
  aviso,
}: {
  ultimo: IResponseMensaje | null;
  noLeidos: number | null;
  ahoraMs: number;
  alAbrir: () => void;
  aviso?: ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  const textos = textosInicio.mensajes;
  const remitente = ultimo ? textos.remitente(ultimo) : '';
  return (
    <View style={estilos.seccion} testID="seccion-mensajes">
      <EncabezadoSeccion
        titulo={textos.titulo}
        dato={!aviso && noLeidos ? textos.sinLeer(noLeidos) : null}
      />
      {aviso ??
        (ultimo ? (
          <TarjetaPulsable
            testID="ultimo-mensaje"
            accessibilityLabel={textos.abrir(remitente, noLeidos)}
            onPress={alAbrir}
          >
            <View style={estilos.fila}>
              <View style={estilos.avatar}>
                <Texto variante="subtitulo" color="sobreExitoSuave">
                  {inicialDe(remitente)}
                </Texto>
              </View>
              <View style={estilos.centro}>
                <View style={estilos.lineaEntre}>
                  <Texto
                    variante="cuerpoFuerte"
                    numberOfLines={1}
                    style={estilos.texto}
                  >
                    {remitente}
                  </Texto>
                  <Texto variante="detalle" color="textoSecundario">
                    {textos.cuando(ultimo.enviadoEl, ahoraMs)}
                  </Texto>
                </View>
                <View style={estilos.lineaEntre}>
                  <Texto
                    variante="detalle"
                    color="textoSecundario"
                    numberOfLines={1}
                    style={estilos.texto}
                  >
                    {textos.contenido(ultimo)}
                  </Texto>
                  {noLeidos ? (
                    <Insignia tono="contador" texto={String(noLeidos)} />
                  ) : null}
                </View>
              </View>
            </View>
          </TarjetaPulsable>
        ) : (
          <VacioSeccion texto={textos.vacio} testID="mensajes-vacio" />
        ))}
    </View>
  );
}
