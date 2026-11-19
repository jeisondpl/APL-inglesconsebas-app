import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoEnLinea } from '@/shared/components/AvisoEnLinea';
import { Texto } from '@/shared/components/Texto';
import { hoyBogota } from '@/shared/lib/fechas';
import { ESPACIO_BARRA_PESTANAS, PulsoCarga } from '@/shared/movimiento';
import { useEstilos, type ITema } from '@/shared/theme';

import { useHiloController } from '../../aplications/controllers/Hilo.controller';
import type { FilaHilo } from '../../domain/entities/Mensajes.entities';
import { filasDelHilo } from '../../domain/validations/mensajes.validations';
import {
  BarraEscribir,
  BurbujaMensaje,
  EncabezadoChat,
  SeparadorDia,
} from '../components/ComponentesMensajes';
import { HojaAdjuntar } from '../components/HojaAdjuntar';
import { HojaReacciones } from '../components/HojaReacciones';
import { textosMensajes as textos } from '../mensajes.textos';

export interface IPropsHiloChat {
  /** Hilo = id del estudiante. */
  idEstudiante: string;
  rol: 'estudiante' | 'profe';
  /** Cómo figuro en las reacciones (`student:<id>` / `teacher:<nombre>`). */
  miReactor: string;
  titulo: string;
  subtitulo?: string;
  /** Con volver (profe), el encabezado muestra la flecha. */
  alVolver?: () => void;
  /** Con false no se sondea (otra pestaña). */
  activo?: boolean;
  alLeer?: () => void;
}

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: tema.colores.fondo },
    teclado: { flex: 1 },
    textoVacio: { textAlign: 'center' },
    lista: { paddingVertical: tema.espaciado.s },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    vacio: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tema.espaciado.xxxl,
    },
    error: { padding: tema.espaciado.xl },
  });

/**
 * Hilo de un chat (F3-01): mensajes por día, sondeo incremental, enviar con mensaje optimista y
 * reacciones con pulsación larga. El estudiante lo ve directo; el profe lo abre desde la bandeja.
 */
export function HiloChat({
  idEstudiante,
  rol,
  miReactor,
  titulo,
  subtitulo,
  alVolver,
  activo = true,
  alLeer,
}: IPropsHiloChat) {
  const estilos = useEstilos(crearEstilos);
  const c = useHiloController({ idEstudiante, rol, activo, alLeer });
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [adjuntando, setAdjuntando] = useState(false);

  useEffect(() => {
    const abre = Keyboard.addListener('keyboardDidShow', () =>
      setTecladoVisible(true),
    );
    const cierra = Keyboard.addListener('keyboardDidHide', () =>
      setTecladoVisible(false),
    );
    return () => {
      abre.remove();
      cierra.remove();
    };
  }, []);

  const hoy = hoyBogota(Date.now());
  // Lista invertida: lo más nuevo abajo y el teclado no lo tapa.
  const filas = useMemo<FilaHilo[]>(
    () => filasDelHilo(c.mensajes).reverse(),
    [c.mensajes],
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={estilos.pantalla}
      testID="chat-hilo"
    >
      <EncabezadoChat
        titulo={titulo}
        subtitulo={subtitulo}
        alVolver={alVolver}
      />
      <KeyboardAvoidingView style={estilos.teclado} behavior="padding">
        {c.estado.tipo === 'cargando' ? (
          <View style={estilos.centro}>
            <PulsoCarga etiqueta={textos.cargando} tamano={56} />
          </View>
        ) : null}

        {c.estado.tipo === 'error' ? (
          <View style={estilos.error}>
            <AvisoEnLinea
              testID="chat-error"
              tono="error"
              titulo={textos.error.titulo}
              mensaje={c.estado.msg}
              accion={{ titulo: textos.error.reintentar, onPress: c._cargar }}
            />
          </View>
        ) : null}

        {c.estado.tipo === 'listo' && filas.length === 0 ? (
          <View style={estilos.vacio} testID="chat-vacio">
            <Texto color="textoSecundario" style={estilos.textoVacio}>
              {textos.vacio[rol === 'profe' ? 'profe' : 'estudiante']}
            </Texto>
          </View>
        ) : null}

        {c.estado.tipo === 'listo' && filas.length > 0 ? (
          <FlatList
            testID="chat-lista"
            inverted
            data={filas}
            keyExtractor={f =>
              f.tipo === 'dia' ? `dia-${f.fecha}` : `m-${f.mensaje.id}`
            }
            contentContainerStyle={estilos.lista}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) =>
              item.tipo === 'dia' ? (
                <SeparadorDia etiqueta={textos.dia.etiqueta(item.fecha, hoy)} />
              ) : (
                <BurbujaMensaje
                  mensaje={item.mensaje}
                  miReactor={miReactor}
                  alMantener={c._abrirReacciones}
                  alReintentar={c._reintentar}
                  alDescartar={c._descartar}
                />
              )
            }
          />
        ) : null}

        {c.estado.tipo === 'listo' ? (
          <BarraEscribir
            texto={c.texto}
            alCambiar={c._cambiarTexto}
            alEnviar={c._enviar}
            alAdjuntar={() => setAdjuntando(true)}
            grabacion={c.grabacion}
            alGrabar={c._grabar}
            alCancelarGrabacion={c._cancelarGrabacion}
            alEnviarGrabacion={c._enviarGrabacion}
            espacioInferior={tecladoVisible ? 8 : ESPACIO_BARRA_PESTANAS + 16}
          />
        ) : null}
      </KeyboardAvoidingView>

      <HojaAdjuntar
        visible={adjuntando}
        alElegir={origen => {
          setAdjuntando(false);
          c._adjuntarImagen(origen);
        }}
        alCerrar={() => setAdjuntando(false)}
      />
      <HojaReacciones
        mensaje={c.seleccion}
        miReactor={miReactor}
        alElegir={c._reaccionar}
        alCerrar={c._cerrarReacciones}
      />
    </SafeAreaView>
  );
}
