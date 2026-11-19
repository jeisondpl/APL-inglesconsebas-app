import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea } from '@/shared/components/AvisoEnLinea';
import { Texto } from '@/shared/components/Texto';
import { ESPACIO_BARRA_PESTANAS, PulsoCarga } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useBandejaController } from '../../aplications/controllers/Bandeja.controller';
import type { IResponseConversacion } from '../../domain/entities/Mensajes.entities';
import { FilaConversacion } from '../components/ComponentesMensajes';
import { textosMensajes as textos } from '../mensajes.textos';

export interface IPropsBandejaChat {
  alAbrir: (c: IResponseConversacion) => void;
  /** Con false (hilo abierto) no se sondea. */
  activo?: boolean;
  alCambiarNoLeidos?: (n: number) => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    encabezado: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: tema.espaciado.s,
      gap: 2,
    },
    lista: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.s,
      paddingBottom: ESPACIO_BARRA_PESTANAS,
      gap: tema.espaciado.m,
    },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    aviso: { paddingHorizontal: tema.espaciado.xl },
    vacio: { textAlign: 'center', paddingTop: tema.espaciado.xxxl },
  });

/** Bandeja del profe (F3-01, 3.5): sus estudiantes, lo más reciente primero, con los no leídos. */
export function BandejaChat({
  alAbrir,
  activo = true,
  alCambiarNoLeidos,
}: IPropsBandejaChat) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const c = useBandejaController({ activo, alCambiarNoLeidos });
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="chat-bandeja"
    >
      <View style={estilos.encabezado}>
        <Texto variante="h1" accessibilityRole="header">
          {textos.bandeja.titulo}
        </Texto>
        <Texto variante="detalle" color="textoSecundario">
          {textos.bandeja.subtitulo}
        </Texto>
      </View>

      {c.estado.tipo === 'cargando' ? (
        <View style={estilos.centro}>
          <PulsoCarga etiqueta={textos.cargando} tamano={56} />
        </View>
      ) : null}

      {c.estado.tipo === 'error' ? (
        <View style={estilos.aviso}>
          <AvisoEnLinea
            testID="bandeja-error"
            tono="error"
            titulo={textos.error.titulo}
            mensaje={c.estado.msg}
            accion={{ titulo: textos.error.reintentar, onPress: c._cargar }}
          />
        </View>
      ) : null}

      {c.estado.tipo === 'listo' ? (
        <FlatList
          testID="bandeja-lista"
          data={c.estado.bandeja.conversaciones}
          keyExtractor={x => x.idEstudiante}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl
              refreshing={c.refrescando}
              onRefresh={c._refrescar}
              tintColor={tema.colores.marca}
              colors={[tema.colores.marca]}
              progressBackgroundColor={tema.colores.superficie}
            />
          }
          ListEmptyComponent={
            <Texto
              testID="bandeja-vacia"
              color="textoSecundario"
              style={estilos.vacio}
            >
              {textos.bandeja.vacio}
            </Texto>
          }
          renderItem={({ item }) => (
            <FilaConversacion conversacion={item} alAbrir={alAbrir} />
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}
