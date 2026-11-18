import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Texto } from '@/shared/components/Texto';
import { IconoEnviar, IconoFlecha } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import type {
  IMensajeChat,
  IResponseConversacion,
} from '../../domain/entities/Mensajes.entities';
import {
  MAX_TEXTO,
  resumenReacciones,
} from '../../domain/validations/mensajes.validations';
import { textosMensajes as textos } from '../mensajes.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    separador: { alignItems: 'center', paddingVertical: tema.espaciado.m },
    pildoraDia: {
      backgroundColor: tema.colores.superficieAlterna,
      borderRadius: tema.radios.pildora,
      paddingHorizontal: tema.espaciado.m,
      paddingVertical: tema.espaciado.xs,
    },
    fila: { paddingHorizontal: tema.espaciado.l, marginVertical: 3 },
    filaMia: { alignItems: 'flex-end' },
    filaOtro: { alignItems: 'flex-start' },
    burbuja: {
      maxWidth: '82%',
      borderRadius: tema.radios.tarjeta,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 2,
    },
    burbujaMia: {
      backgroundColor: tema.colores.marca,
      borderBottomRightRadius: 6,
    },
    burbujaOtro: {
      backgroundColor: tema.colores.superficieAlterna,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      borderBottomLeftRadius: 6,
    },
    fallida: { borderWidth: 1, borderColor: tema.colores.peligro },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    acciones: { flexDirection: 'row', gap: tema.espaciado.l, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: tema.radios.pildora,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      backgroundColor: tema.colores.superficie,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    chipMia: {
      borderColor: tema.colores.bordeMarca,
      backgroundColor: tema.colores.destacado,
    },
    barra: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: tema.espaciado.s,
      paddingHorizontal: tema.espaciado.l,
      paddingTop: tema.espaciado.s,
      borderTopWidth: 1,
      borderTopColor: tema.colores.borde,
      backgroundColor: tema.colores.fondo,
    },
    entrada: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      borderRadius: 22,
      backgroundColor: tema.colores.campoFondo,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      color: tema.colores.texto,
      fontFamily: tema.familias.dmSansRegular,
      fontSize: 14,
    },
    entradaFoco: { borderColor: tema.colores.marca },
    boton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.marca,
    },
    botonInactivo: { backgroundColor: tema.colores.pista },
    conversacion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.m,
      minHeight: 64,
      paddingVertical: tema.espaciado.m,
      paddingHorizontal: tema.espaciado.l,
      backgroundColor: tema.colores.superficie,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      borderRadius: tema.radios.tarjeta,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.destacado,
    },
    cuerpo: { flex: 1, gap: 2 },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.s,
      paddingHorizontal: tema.espaciado.l,
      paddingVertical: tema.espaciado.s,
      minHeight: 56,
    },
    volver: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contador: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.colores.marca,
    },
  });

export function SeparadorDia({ etiqueta }: { etiqueta: string }) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.separador}>
      <View style={estilos.pildoraDia}>
        <Texto variante="detalle" color="textoSecundario">
          {etiqueta}
        </Texto>
      </View>
    </View>
  );
}

export interface IPropsBurbuja {
  mensaje: IMensajeChat;
  miReactor: string;
  alMantener: (id: number) => void;
  alReintentar: (clave: number) => void;
  alDescartar: (clave: number) => void;
}

/** Texto del estado de un mensaje propio. */
function estadoDe(m: IMensajeChat): string {
  if (m.envio === 'enviando') {
    return textos.mensaje.estado.enviando;
  }
  if (m.envio === 'fallido') {
    return textos.mensaje.estado.fallido;
  }
  return m.leido ? textos.mensaje.estado.visto : textos.mensaje.estado.enviado;
}

/** Burbuja de un mensaje: propios a la derecha, ajenos a la izquierda. Mantener pulsado reacciona. */
export function BurbujaMensaje({
  mensaje: m,
  miReactor,
  alMantener,
  alReintentar,
  alDescartar,
}: IPropsBurbuja) {
  const estilos = useEstilos(crearEstilos);
  const autor = m.mio ? textos.mensaje.tu : m.nombre ?? textos.mensaje.academia;
  const estado = m.mio ? estadoDe(m) : '';
  const colorTexto = m.mio ? 'sobreMarca' : 'texto';
  const reacciones = resumenReacciones(m.reacciones, miReactor);
  return (
    <View
      style={[estilos.fila, m.mio ? estilos.filaMia : estilos.filaOtro]}
      testID={`mensaje-${m.id}`}
    >
      <Pressable
        onLongPress={() => alMantener(m.id)}
        delayLongPress={350}
        accessibilityRole="text"
        accessibilityLabel={textos.mensaje.accesible(m, autor, estado)}
        accessibilityHint={textos.mensaje.reaccionarAyuda}
        style={[
          estilos.burbuja,
          m.mio ? estilos.burbujaMia : estilos.burbujaOtro,
          m.envio === 'fallido' && estilos.fallida,
        ]}
      >
        {!m.mio ? (
          <Texto variante="etiqueta" color="textoSecundario">
            {autor}
          </Texto>
        ) : null}
        {m.texto ? <Texto color={colorTexto}>{m.texto}</Texto> : null}
        {m.tieneImagen ? (
          <Texto variante="cuerpoFuerte" color={colorTexto}>
            {textos.mensaje.foto}
          </Texto>
        ) : null}
        {m.tieneVoz ? (
          <Texto variante="cuerpoFuerte" color={colorTexto}>
            {textos.mensaje.voz}
          </Texto>
        ) : null}
        <View style={estilos.meta}>
          <Texto
            variante="insignia"
            color={m.mio ? 'sobreMarca' : 'textoSecundario'}
          >
            {textos.mensaje.hora(m)}
          </Texto>
          {m.mio ? (
            <Texto
              variante="insignia"
              color={m.envio === 'fallido' ? 'peligro' : 'sobreMarca'}
            >
              {estado}
            </Texto>
          ) : null}
        </View>
      </Pressable>
      {reacciones.length > 0 ? (
        <View style={estilos.chips}>
          {reacciones.map(r => (
            <View
              key={r.emoji}
              style={[estilos.chip, r.mia && estilos.chipMia]}
              accessible
              accessibilityLabel={textos.reacciones.resumen(
                r.emoji,
                r.cantidad,
                r.mia,
              )}
            >
              <Texto variante="detalle">{r.emoji}</Texto>
              {r.cantidad > 1 ? (
                <Texto variante="insignia" color="textoSecundario">
                  {r.cantidad}
                </Texto>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      {m.envio === 'fallido' ? (
        <View style={estilos.acciones}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={textos.mensaje.reintentar}
            onPress={() => alReintentar(-m.id)}
            hitSlop={10}
            testID={`mensaje-reintentar-${-m.id}`}
          >
            <Texto variante="cuerpoFuerte" color="marca">
              {textos.mensaje.reintentar}
            </Texto>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={textos.mensaje.descartar}
            onPress={() => alDescartar(-m.id)}
            hitSlop={10}
            testID={`mensaje-descartar-${-m.id}`}
          >
            <Texto variante="cuerpoFuerte" color="textoSecundario">
              {textos.mensaje.descartar}
            </Texto>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export interface IPropsBarraEscribir {
  texto: string;
  alCambiar: (texto: string) => void;
  alEnviar: () => void;
  /** Espacio inferior (la barra de pestañas cuando el teclado está cerrado). */
  espacioInferior: number;
}

/** Caja de texto con el botón de enviar. */
export function BarraEscribir({
  texto,
  alCambiar,
  alEnviar,
  espacioInferior,
}: IPropsBarraEscribir) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  const [enfocado, setEnfocado] = useState(false);
  const puede = texto.trim().length > 0;
  return (
    <View style={[estilos.barra, { paddingBottom: espacioInferior }]}>
      <TextInput
        testID="chat-entrada"
        style={[estilos.entrada, enfocado && estilos.entradaFoco]}
        value={texto}
        onChangeText={alCambiar}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={textos.escribir.placeholder}
        placeholderTextColor={tema.colores.textoTenue}
        accessibilityLabel={textos.escribir.etiqueta}
        multiline
        maxLength={MAX_TEXTO}
      />
      <Pressable
        testID="chat-enviar"
        accessibilityRole="button"
        accessibilityLabel={textos.escribir.enviar}
        accessibilityState={{ disabled: !puede }}
        disabled={!puede}
        onPress={() => {
          alEnviar();
        }}
        style={[estilos.boton, !puede && estilos.botonInactivo]}
      >
        <IconoEnviar
          color={puede ? tema.colores.sobreMarca : tema.colores.textoTenue}
        />
      </Pressable>
    </View>
  );
}

export interface IPropsEncabezadoChat {
  titulo: string;
  subtitulo?: string;
  alVolver?: () => void;
}

export function EncabezadoChat({
  titulo,
  subtitulo,
  alVolver,
}: IPropsEncabezadoChat) {
  const { tema } = useTema();
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.encabezado}>
      {alVolver ? (
        <Pressable
          testID="chat-volver"
          onPress={alVolver}
          accessibilityRole="button"
          accessibilityLabel={textos.volver}
          style={estilos.volver}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconoFlecha color={tema.colores.texto} />
          </View>
        </Pressable>
      ) : null}
      <View style={estilos.cuerpo}>
        <Texto variante="titulo" accessibilityRole="header" numberOfLines={1}>
          {titulo}
        </Texto>
        {subtitulo ? (
          <Texto variante="detalle" color="textoSecundario" numberOfLines={1}>
            {subtitulo}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

export interface IPropsFilaConversacion {
  conversacion: IResponseConversacion;
  alAbrir: (c: IResponseConversacion) => void;
}

/** Una conversación de la bandeja del profe. */
export function FilaConversacion({
  conversacion: c,
  alAbrir,
}: IPropsFilaConversacion) {
  const estilos = useEstilos(crearEstilos);
  const ultimo = c.ultimo;
  const previa = ultimo
    ? `${ultimo.mio ? textos.bandeja.tu : ''}${textos.bandeja.vistaPrevia(
        ultimo,
      )}`
    : textos.bandeja.sinMensajes;
  return (
    <Pressable
      testID={`conversacion-${c.idEstudiante}`}
      onPress={() => alAbrir(c)}
      accessibilityRole="button"
      accessibilityLabel={`${textos.bandeja.abrir(c.nombre)}. ${previa}${
        c.noLeidos ? `. ${textos.bandeja.noLeidos(c.noLeidos)}` : ''
      }`}
      style={estilos.conversacion}
    >
      <View style={estilos.avatar}>
        <Texto variante="titulo" color="marca">
          {c.nombre.trim().charAt(0).toUpperCase() || '?'}
        </Texto>
      </View>
      <View style={estilos.cuerpo}>
        <Texto
          variante={c.noLeidos ? 'cuerpoFuerte' : 'cuerpo'}
          numberOfLines={1}
        >
          {c.nombre}
        </Texto>
        <Texto
          variante="detalle"
          color={c.noLeidos ? 'texto' : 'textoSecundario'}
          numberOfLines={1}
        >
          {previa}
        </Texto>
      </View>
      {c.noLeidos > 0 ? (
        <View style={estilos.contador}>
          <Texto variante="insignia" color="sobreMarca">
            {c.noLeidos}
          </Texto>
        </View>
      ) : null}
    </Pressable>
  );
}
