import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/shared/components/Boton';
import { Insignia, type TonoInsignia } from '@/shared/components/Insignia';
import { Tarjeta } from '@/shared/components/Tarjeta';
import { Texto } from '@/shared/components/Texto';
import { IconoFlecha, IconoMensajes, IconoTareas } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import type {
  IClaseHoy,
  IResponseAsistenciaPendiente,
  IResponseTareaRevision,
  MomentoClase,
} from '../../domain/entities/InicioProfe.entities';
import { inicialDe } from '../../domain/validations/inicio.validations';
import { textosInicioProfe as textos } from '../inicioProfe.textos';
import { EncabezadoSeccion, VacioSeccion } from './SeccionesLista';
import { TarjetaPulsable } from './TarjetaPulsable';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    seccion: { gap: tema.espaciado.s },
    lista: { gap: 10 },
    fila: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    hora: { minWidth: 76 },
    centro: { flex: 1, minWidth: 0, gap: 2 },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: tema.radios.pildora,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.exitoSuave,
    },
    caja: {
      width: 36,
      height: 36,
      borderRadius: tema.radios.icono,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.superficieAlterna,
    },
    cabecera: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tema.espaciado.s,
    },
    horaDestacada: { marginTop: tema.espaciado.xs },
    boton: { marginTop: tema.espaciado.s },
    marcar: { paddingHorizontal: tema.espaciado.l },
  });

const TONO_MOMENTO: Record<MomentoClase, TonoInsignia> = {
  proxima: 'neutra',
  en_curso: 'exito',
  por_marcar: 'aviso',
  tomada: 'exito',
  no_asistio: 'peligro',
};

/** La clase en curso o la siguiente de hoy, con el botón de Zoom. */
export function TarjetaClaseDestacada({
  clase,
  alAbrirZoom,
}: {
  clase: IClaseHoy;
  alAbrirZoom: (enlace: string) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const t = textos.destacada;
  const enlace = clase.enlaceZoom;
  const numero = textos.hoy.numero(clase.numeroClase);
  return (
    <Tarjeta variante="destacada" testID="clase-destacada">
      <View style={estilos.cabecera}>
        <Texto variante="etiqueta" color="marca" accessibilityRole="header">
          {clase.momento === 'en_curso' ? t.ahora : t.siguiente}
        </Texto>
        <Insignia
          tono={TONO_MOMENTO[clase.momento]}
          texto={textos.hoy.momento[clase.momento]}
        />
      </View>
      <Texto variante="h2" style={estilos.horaDestacada}>
        {t.hora(clase.hora)}
      </Texto>
      <Texto variante="cuerpoFuerte">{clase.estudiante}</Texto>
      {numero ? (
        <Texto variante="detalle" color="textoSecundario">
          {numero}
        </Texto>
      ) : null}
      {enlace ? (
        <Boton
          titulo={t.abrirZoom}
          accessibilityHint={t.abrirZoomAyuda}
          onPress={() => alAbrirZoom(enlace)}
          style={estilos.boton}
        />
      ) : (
        <Texto variante="detalle" color="textoSecundario">
          {t.sinEnlace}
        </Texto>
      )}
    </Tarjeta>
  );
}

/** Agenda del día: una fila por clase con hora, estudiante y en qué punto está. */
export function SeccionClasesHoy({
  clases,
  aviso,
}: {
  clases: IClaseHoy[];
  aviso?: ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.seccion} testID="seccion-clases-hoy">
      <EncabezadoSeccion
        titulo={textos.hoy.titulo}
        dato={!aviso && clases.length ? textos.hoy.total(clases.length) : null}
      />
      {aviso ??
        (clases.length === 0 ? (
          <VacioSeccion texto={textos.hoy.vacio} testID="clases-hoy-vacio" />
        ) : (
          <View style={estilos.lista}>
            {clases.map(clase => {
              const numero = textos.hoy.numero(clase.numeroClase);
              return (
                <View
                  key={clase.id}
                  testID={`clase-hoy-${clase.id}`}
                  accessible
                  accessibilityLabel={textos.hoy.accesible(clase)}
                >
                  <Tarjeta>
                    <View style={estilos.fila}>
                      <Texto variante="cuerpoFuerte" style={estilos.hora}>
                        {textos.destacada.hora(clase.hora)}
                      </Texto>
                      <View style={estilos.centro}>
                        <Texto variante="cuerpo" numberOfLines={1}>
                          {clase.estudiante}
                        </Texto>
                        {numero ? (
                          <Texto variante="detalle" color="textoSecundario">
                            {numero}
                          </Texto>
                        ) : null}
                      </View>
                      <Insignia
                        tono={TONO_MOMENTO[clase.momento]}
                        texto={textos.hoy.momento[clase.momento]}
                      />
                    </View>
                  </Tarjeta>
                </View>
              );
            })}
          </View>
        ))}
    </View>
  );
}

/** Clases ya dadas sin asistencia marcada. Marcar llega en F2-02: el botón avisa. */
export function SeccionAsistencias({
  lista,
  total,
  alMarcar,
  aviso,
}: {
  lista: IResponseAsistenciaPendiente[];
  total: number;
  alMarcar: () => void;
  aviso?: ReactNode;
}) {
  const estilos = useEstilos(crearEstilos);
  const t = textos.asistencias;
  return (
    <View style={estilos.seccion} testID="seccion-asistencias">
      <EncabezadoSeccion
        titulo={t.titulo}
        dato={!aviso && total > 0 ? t.total(total) : null}
      />
      {aviso ??
        (lista.length === 0 ? (
          <VacioSeccion texto={t.vacio} testID="asistencias-vacio" />
        ) : (
          <View style={estilos.lista}>
            {lista.map(a => (
              <Tarjeta key={a.id} testID={`asistencia-${a.id}`}>
                <View style={estilos.fila}>
                  <View style={estilos.avatar}>
                    <Texto variante="subtitulo" color="sobreExitoSuave">
                      {inicialDe(a.estudiante)}
                    </Texto>
                  </View>
                  <View style={estilos.centro}>
                    <Texto variante="cuerpoFuerte" numberOfLines={1}>
                      {a.estudiante}
                    </Texto>
                    <Texto variante="detalle" color="aviso">
                      {t.detalle(a.fecha, a.hora)}
                    </Texto>
                  </View>
                  <Boton
                    variante="secundario"
                    titulo={t.marcar}
                    accessibilityLabel={t.marcarAccesible(a.estudiante)}
                    onPress={alMarcar}
                    style={estilos.marcar}
                  />
                </View>
              </Tarjeta>
            ))}
            {total > lista.length ? (
              <Texto variante="detalle" color="textoSecundario">
                {t.mas(total - lista.length)}
              </Texto>
            ) : null}
          </View>
        ))}
    </View>
  );
}

export function SeccionRevisar({
  lista,
  total,
  alAbrir,
  aviso,
}: {
  lista: IResponseTareaRevision[];
  total: number;
  alAbrir: () => void;
  aviso?: ReactNode;
}) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const t = textos.revisar;
  return (
    <View style={estilos.seccion} testID="seccion-revisar">
      <EncabezadoSeccion
        titulo={t.titulo}
        dato={!aviso && total > 0 ? t.total(total) : null}
      />
      {aviso ??
        (lista.length === 0 ? (
          <VacioSeccion texto={t.vacio} testID="revisar-vacio" />
        ) : (
          <View style={estilos.lista}>
            {lista.map(tarea => {
              const titulo = tarea.titulo || t.sinTitulo;
              return (
                <TarjetaPulsable
                  key={tarea.id}
                  testID={`revisar-${tarea.id}`}
                  accessibilityLabel={t.abrir(titulo, tarea.estudiante)}
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
                      {tarea.estudiante ? (
                        <Texto
                          variante="detalle"
                          color="textoSecundario"
                          numberOfLines={1}
                        >
                          {tarea.estudiante}
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

export function TarjetaMensajesProfe({
  noLeidos,
  alAbrir,
}: {
  noLeidos: number;
  alAbrir: () => void;
}) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const t = textos.mensajes;
  const texto = noLeidos > 0 ? t.sinLeer(noLeidos) : t.alDia;
  return (
    <View style={estilos.seccion} testID="seccion-mensajes-profe">
      <EncabezadoSeccion titulo={t.titulo} />
      <TarjetaPulsable
        testID="mensajes-profe"
        accessibilityLabel={`${t.abrir}. ${texto}`}
        onPress={alAbrir}
      >
        <View style={estilos.fila}>
          <View style={estilos.caja}>
            <IconoMensajes tamano={18} color={tema.colores.marca} />
          </View>
          <Texto variante="cuerpo" style={estilos.centro}>
            {texto}
          </Texto>
          {noLeidos > 0 ? (
            <Insignia tono="contador" texto={String(noLeidos)} />
          ) : null}
          <IconoFlecha tamano={16} color={tema.colores.textoTenue} />
        </View>
      </TarjetaPulsable>
    </View>
  );
}
