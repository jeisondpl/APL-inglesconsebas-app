import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Insignia, Tarjeta, Texto } from '@/shared/components';
import { fechaCorta } from '@/shared/lib/fechas';
import { IconoDetener, IconoReproducir } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import {
  useReproductor,
  type IReproductorController,
} from '../../aplications/controllers/Audio.controller';
import type { IMediaTareaController } from '../../aplications/controllers/Detalle.controller';
import type { IResponseTarea } from '../../domain/entities/Tareas.entities';
import {
  duracionDeVoz,
  estaVencida,
} from '../../domain/validations/tareas.validations';
import { textosTareas as textos } from '../tareas.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    cuerpo: { gap: tema.espaciado.xs },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    titulo: { flex: 1 },
    voz: { flexDirection: 'row', alignItems: 'center', gap: tema.espaciado.m },
    botonVoz: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.marca,
    },
    pista: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: tema.colores.pista,
    },
    avance: {
      height: 4,
      borderRadius: 2,
      backgroundColor: tema.colores.marca,
    },
    imagen: {
      width: '100%',
      height: 220,
      borderRadius: tema.radios.campo,
      backgroundColor: tema.colores.pista,
    },
    galeria: { gap: tema.espaciado.m },
  });

/** Estado de una tarea para la insignia de su tarjeta. */
export function estadoDeTarjeta(
  t: IResponseTarea,
  rol: 'estudiante' | 'profe',
  ahoraMs: number,
): { texto: string; tono: 'exito' | 'aviso' | 'peligro' | 'neutra' } {
  if (t.estado === 'reviewed') {
    if (rol === 'estudiante' && !t.feedbackVisto) {
      return { texto: textos.tarjeta.nueva, tono: 'exito' };
    }
    return {
      texto: t.nota ? textos.tarjeta.nota(t.nota) : textos.tarjeta.revisada,
      tono: 'neutra',
    };
  }
  if (t.estado === 'ready_review') {
    return {
      texto:
        rol === 'profe' ? textos.tarjeta.entregada : textos.tarjeta.porRevisar,
      tono: rol === 'profe' ? 'aviso' : 'neutra',
    };
  }
  return estaVencida(t, ahoraMs)
    ? { texto: textos.tarjeta.vencida, tono: 'peligro' }
    : { texto: textos.tarjeta.pendiente, tono: 'neutra' };
}

/** Una tarea en la lista: título, estudiante (profe), fecha de entrega y su estado. */
export function TarjetaTarea({
  tarea: t,
  rol,
  ahoraMs,
  alAbrir,
}: {
  tarea: IResponseTarea;
  rol: 'estudiante' | 'profe';
  ahoraMs: number;
  alAbrir: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const e = estadoDeTarjeta(t, rol, ahoraMs);
  return (
    <Tarjeta
      testID={`tarea-${t.id}`}
      onPress={alAbrir}
      accessibilityLabel={textos.tarjeta.etiqueta(t.titulo, e.texto)}
    >
      <View style={estilos.cabecera}>
        <View style={[estilos.cuerpo, estilos.titulo]}>
          <Texto variante="titulo">{t.titulo}</Texto>
          {rol === 'profe' && t.estudiante ? (
            <Texto variante="detalle" color="textoSecundario">
              {t.estudiante}
            </Texto>
          ) : null}
        </View>
        <Insignia texto={e.texto} tono={e.tono} />
      </View>
      <Texto variante="detalle" color="textoSecundario">
        {t.vence
          ? textos.tarjeta.vence(fechaCorta(t.vence))
          : textos.tarjeta.sinFecha}
      </Texto>
    </Tarjeta>
  );
}

/** Audio con botón, avance y duración. Con `dataUrl` nulo está cargando. */
export function ReproductorVoz({
  dataUrl,
  clave,
  duracionMs,
  testID,
}: {
  dataUrl: string | null;
  clave: string;
  duracionMs?: number | null;
  testID: string;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const r: IReproductorController = useReproductor(
    dataUrl,
    clave,
    duracionMs ?? null,
  );
  const sonando = r.estado.tipo === 'reproduciendo';
  const cargando = r.estado.tipo === 'cargando';
  return (
    <View style={estilos.voz} testID={testID}>
      <Pressable
        testID={`${testID}-alternar`}
        accessibilityRole="button"
        accessibilityLabel={
          cargando
            ? textos.voz.cargando
            : sonando
            ? textos.voz.detener
            : textos.voz.reproducir
        }
        accessibilityState={{ disabled: cargando }}
        disabled={cargando}
        onPress={() => {
          r._alternar();
        }}
        style={estilos.botonVoz}
      >
        {sonando ? (
          <IconoDetener color={tema.colores.sobreMarca} />
        ) : (
          <IconoReproducir color={tema.colores.sobreMarca} />
        )}
      </Pressable>
      <View style={estilos.pista}>
        <View
          style={[
            estilos.avance,
            { width: `${Math.round(r.progreso * 100)}%` },
          ]}
        />
      </View>
      <Texto variante="insignia" color="textoSecundario">
        {r.duracionMs === null ? '–:––' : duracionDeVoz(r.duracionMs)}
      </Texto>
    </View>
  );
}

/** Voz e imágenes de una parte de la tarea, ya bajadas (o su estado de carga/error). */
export function ContenidoMedia({
  media,
  clave,
  testID,
}: {
  media: IMediaTareaController;
  clave: string;
  testID: string;
}) {
  const estilos = useEstilos(crearEstilos);
  const { estado } = media;
  if (estado.tipo === 'sin') {
    return null;
  }
  if (estado.tipo === 'cargando') {
    return (
      <Texto
        variante="detalle"
        color="textoSecundario"
        testID={`${testID}-cargando`}
      >
        {textos.detalle.cargandoContenido}
      </Texto>
    );
  }
  if (estado.tipo === 'error') {
    return (
      <Pressable
        testID={`${testID}-reintentar`}
        accessibilityRole="button"
        accessibilityLabel={textos.detalle.reintentar}
        onPress={() => {
          media._reintentar();
        }}
      >
        <Texto variante="detalle" color="textoSecundario">
          {`${textos.detalle.noSePudoContenido}. ${textos.detalle.reintentar}`}
        </Texto>
      </Pressable>
    );
  }
  return (
    <View style={estilos.galeria} testID={testID}>
      {estado.media.voz ? (
        <ReproductorVoz
          testID={`${testID}-voz`}
          dataUrl={estado.media.voz}
          clave={clave}
        />
      ) : null}
      {estado.media.imagenes.map((uri, i) => (
        <Image
          key={`${clave}-${i}`}
          source={{ uri }}
          style={estilos.imagen}
          resizeMode="cover"
          accessibilityLabel={textos.detalle.imagen(i + 1)}
        />
      ))}
    </View>
  );
}
