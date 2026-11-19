import { StyleSheet, View } from 'react-native';

import { Boton, Campo, Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import type { IDetalleTareaController } from '../../aplications/controllers/Detalle.controller';
import {
  duracionDeVoz,
  MAX_COMENTARIO,
  MAX_NOTA,
  MAX_TEXTO_ENTREGA,
} from '../../domain/validations/tareas.validations';
import { textosTareas as textos } from '../tareas.textos';
import { ReproductorVoz } from './ComponentesTareas';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    raiz: { gap: tema.espaciado.m },
    grabando: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tema.espaciado.m,
    },
    acciones: { flexDirection: 'row', gap: tema.espaciado.m },
    accion: { flex: 1 },
  });

/** Grabar un audio y dejarlo listo para enviar con el formulario. */
function BloqueAudio({ c }: { c: IDetalleTareaController }) {
  const estilos = useEstilos(crearEstilos);
  const { grabadora } = c;
  if (grabadora.grabacion.tipo === 'grabando') {
    return (
      <View style={estilos.raiz} testID="tarea-grabando">
        <Texto variante="cuerpoFuerte">
          {textos.formulario.grabando(duracionDeVoz(grabadora.grabacion.ms))}
        </Texto>
        <View style={estilos.acciones}>
          <Boton
            testID="tarea-grabar-cancelar"
            variante="secundario"
            titulo={textos.formulario.cancelar}
            onPress={() => {
              grabadora._cancelar();
            }}
            style={estilos.accion}
          />
          <Boton
            testID="tarea-grabar-terminar"
            titulo={textos.formulario.detener}
            onPress={() => {
              grabadora._terminar();
            }}
            style={estilos.accion}
          />
        </View>
      </View>
    );
  }
  if (grabadora.voz) {
    return (
      <View style={estilos.raiz} testID="tarea-audio-listo">
        <Texto variante="detalle" color="textoSecundario">
          {textos.formulario.audioListo}
        </Texto>
        <ReproductorVoz
          testID="tarea-audio-previa"
          dataUrl={grabadora.voz.dataUrl}
          clave="borrador"
          duracionMs={grabadora.voz.duracionMs}
        />
        <Boton
          testID="tarea-audio-descartar"
          variante="secundario"
          titulo={textos.formulario.descartar}
          onPress={grabadora._descartarVoz}
        />
      </View>
    );
  }
  return (
    <Boton
      testID="tarea-grabar"
      variante="secundario"
      titulo={textos.formulario.grabar}
      onPress={() => {
        grabadora._grabar();
      }}
    />
  );
}

/** Formulario de la entrega (estudiante, 3.8) o del feedback (profe, 3.10). */
export function FormularioTarea({
  c,
  rol,
  reentrega,
}: {
  c: IDetalleTareaController;
  rol: 'estudiante' | 'profe';
  /** Ya hay una entrega: se está cambiando. */
  reentrega: boolean;
}) {
  const estilos = useEstilos(crearEstilos);
  const grabando = c.grabadora.grabacion.tipo === 'grabando';
  if (rol === 'estudiante') {
    return (
      <View style={estilos.raiz} testID="tarea-formulario-entrega">
        <Texto variante="titulo">{textos.formulario.tuRespuesta}</Texto>
        <Texto variante="detalle" color="textoSecundario">
          {reentrega
            ? textos.formulario.reentregar
            : textos.formulario.tuRespuestaAyuda}
        </Texto>
        <Campo
          testID="tarea-respuesta"
          etiqueta={textos.formulario.tuRespuesta}
          valor={c.texto}
          alCambiar={c._cambiarTexto}
          placeholder={textos.formulario.respuestaMarcador}
          multiline
          maxLength={MAX_TEXTO_ENTREGA}
          textAlignVertical="top"
        />
        <BloqueAudio c={c} />
        <Boton
          testID="tarea-enviar"
          titulo={
            reentrega
              ? textos.formulario.reenviarEntrega
              : textos.formulario.enviarEntrega
          }
          onPress={() => {
            c._enviar();
          }}
          cargando={c.enviando}
          deshabilitado={grabando}
        />
      </View>
    );
  }
  return (
    <View style={estilos.raiz} testID="tarea-formulario-feedback">
      <Texto variante="titulo">{textos.detalle.feedback}</Texto>
      <Campo
        testID="tarea-comentario"
        etiqueta={textos.formulario.comentario}
        valor={c.comentario}
        alCambiar={c._cambiarComentario}
        placeholder={textos.formulario.comentarioMarcador}
        multiline
        maxLength={MAX_COMENTARIO}
        textAlignVertical="top"
      />
      <Campo
        testID="tarea-nota"
        etiqueta={textos.formulario.nota}
        valor={c.nota}
        alCambiar={c._cambiarNota}
        placeholder={textos.formulario.notaMarcador}
        maxLength={MAX_NOTA}
      />
      <BloqueAudio c={c} />
      <Boton
        testID="tarea-enviar"
        titulo={textos.formulario.enviarFeedback}
        onPress={() => {
          c._enviar();
        }}
        cargando={c.enviando}
        deshabilitado={grabando}
      />
    </View>
  );
}
