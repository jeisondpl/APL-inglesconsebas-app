import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton, Insignia, Tarjeta, Texto } from '@/shared/components';
import { fechaCorta } from '@/shared/lib/fechas';
import { IconoFlecha } from '@/shared/iconos';
import { ESPACIO_BARRA_PESTANAS } from '@/shared/movimiento';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useDetalleTareaController } from '../../aplications/controllers/Detalle.controller';
import type { IResponseTarea } from '../../domain/entities/Tareas.entities';
import {
  ContenidoMedia,
  estadoDeTarjeta,
} from '../components/ComponentesTareas';
import { FormularioTarea } from '../components/FormularioTarea';
import { textosTareas as textos } from '../tareas.textos';

export interface IPropsDetalleTarea {
  tarea: IResponseTarea;
  rol: 'estudiante' | 'profe';
  ahoraMs: number;
  alVolver: () => void;
  /** Algo cambió en el servidor (entrega, feedback visto): que la lista se actualice. */
  alCambio: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    contenido: {
      paddingHorizontal: tema.espaciado.xl,
      paddingTop: tema.espaciado.m,
      paddingBottom: ESPACIO_BARRA_PESTANAS + tema.espaciado.xl,
      gap: tema.espaciado.l,
    },
    volver: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.s,
      minHeight: tema.toqueMinimo,
    },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    titulo: { flex: 1, gap: tema.espaciado.xs },
    bloque: { gap: tema.espaciado.m },
  });

/**
 * Detalle de una tarea (F3-02, 3.7 a 3.10): consigna con su audio e imágenes, la entrega, el
 * feedback y el formulario del rol. Los PDF solo se abren desde la web.
 */
export function DetalleTarea({
  tarea,
  rol,
  ahoraMs,
  alVolver,
  alCambio,
}: IPropsDetalleTarea) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const c = useDetalleTareaController(tarea, rol, alCambio);
  const e = estadoDeTarjeta(tarea, rol, ahoraMs);
  const hayEntrega =
    tarea.entrega !== null ||
    tarea.tieneVozEntrega ||
    tarea.imagenesEntrega > 0;
  const hayFeedback =
    tarea.comentario !== null || tarea.nota !== null || tarea.tieneVozFeedback;
  // Con el feedback ya dado, el formulario de la profe queda cerrado tras «Editar feedback»: si no,
  // la pantalla repite el mismo comentario y la nota dos veces. Cada tarea nueva lo vuelve a cerrar.
  const [editando, setEditando] = useState(false);
  useEffect(() => {
    setEditando(false);
  }, [tarea]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="tarea-detalle"
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          testID="tarea-volver"
          accessibilityRole="button"
          accessibilityLabel={textos.detalle.volver}
          onPress={alVolver}
          style={estilos.volver}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconoFlecha color={tema.colores.marca} />
          </View>
          <Texto variante="cuerpoFuerte" color="marca">
            {textos.titulo}
          </Texto>
        </Pressable>

        <View style={estilos.cabecera}>
          <View style={estilos.titulo}>
            <Texto variante="h1" accessibilityRole="header">
              {tarea.titulo}
            </Texto>
            {rol === 'profe' && tarea.estudiante ? (
              <Texto color="textoSecundario">{tarea.estudiante}</Texto>
            ) : null}
            {tarea.vence ? (
              <Texto variante="detalle" color="textoSecundario">
                {textos.tarjeta.vence(fechaCorta(tarea.vence))}
              </Texto>
            ) : null}
          </View>
          <Insignia texto={e.texto} tono={e.tono} />
        </View>

        <Tarjeta testID="tarea-consigna">
          <View style={estilos.bloque}>
            <Texto variante="titulo">{textos.detalle.consigna}</Texto>
            <Texto>
              {tarea.instruccion !== ''
                ? tarea.instruccion
                : textos.detalle.sinConsigna}
            </Texto>
            <ContenidoMedia
              media={c.instruccion}
              clave={`i${tarea.id}`}
              testID="tarea-media-instruccion"
            />
            {tarea.archivos > 0 ? (
              <Texto variante="detalle" color="textoSecundario">
                {textos.detalle.archivos(tarea.archivos)}
              </Texto>
            ) : null}
          </View>
        </Tarjeta>

        {hayEntrega || rol === 'profe' ? (
          <Tarjeta testID="tarea-entrega">
            <View style={estilos.bloque}>
              <Texto variante="titulo">
                {rol === 'profe' && tarea.estudiante
                  ? textos.detalle.entregaDe(tarea.estudiante)
                  : textos.detalle.entrega}
              </Texto>
              {tarea.entrega ? <Texto>{tarea.entrega}</Texto> : null}
              {!hayEntrega ? (
                <Texto variante="detalle" color="textoSecundario">
                  {textos.detalle.sinEntrega}
                </Texto>
              ) : null}
              <ContenidoMedia
                media={c.entrega}
                clave={`e${tarea.id}`}
                testID="tarea-media-entrega"
              />
            </View>
          </Tarjeta>
        ) : null}

        {hayFeedback ? (
          <Tarjeta variante="destacada" testID="tarea-feedback">
            <View style={estilos.bloque}>
              <Texto variante="titulo">{textos.detalle.feedback}</Texto>
              {tarea.nota ? (
                <Texto variante="h1" color="marca">
                  {tarea.nota}
                </Texto>
              ) : null}
              {tarea.comentario ? <Texto>{tarea.comentario}</Texto> : null}
              <ContenidoMedia
                media={c.feedback}
                clave={`f${tarea.id}`}
                testID="tarea-media-feedback"
              />
            </View>
          </Tarjeta>
        ) : null}

        {c.puedeEntregar ? (
          <FormularioTarea c={c} rol="estudiante" reentrega={hayEntrega} />
        ) : null}
        {c.puedeRevisar && hayFeedback && !editando ? (
          <Boton
            testID="tarea-editar-feedback"
            variante="secundario"
            titulo={textos.formulario.editarFeedback}
            onPress={() => setEditando(true)}
          />
        ) : null}
        {c.puedeRevisar && (!hayFeedback || editando) ? (
          <FormularioTarea c={c} rol="profe" reentrega={hayEntrega} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
