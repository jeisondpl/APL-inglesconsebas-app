import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/shared/components/Texto';
import { IconoDetener, IconoReproducir } from '@/shared/iconos';
import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { useVozController } from '../../aplications/controllers/Voz.controller';
import type { IMensajeChat } from '../../domain/entities/Mensajes.entities';
import { duracionDeVoz } from '../../domain/validations/mensajes.validations';
import { textosMensajes as textos } from '../mensajes.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tema.espaciado.m,
      minWidth: 200,
    },
    boton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonMio: { backgroundColor: tema.colores.sobreMarca },
    botonOtro: { backgroundColor: tema.colores.marca },
    pista: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    pistaMia: { backgroundColor: tema.colores.bordeMarca },
    pistaOtro: { backgroundColor: tema.colores.pista },
    avance: { height: 4, borderRadius: 2 },
    avanceMio: { backgroundColor: tema.colores.sobreMarca },
    avanceOtro: { backgroundColor: tema.colores.marca },
  });

/** Nota de voz dentro de la burbuja: reproducir/detener, avance y duración. */
export function NotaVoz({
  mensaje: m,
  alMantener,
}: {
  mensaje: IMensajeChat;
  alMantener?: () => void;
}) {
  const estilos = useEstilos(crearEstilos);
  const { tema } = useTema();
  const c = useVozController(m);
  const color = m.mio ? 'sobreMarca' : 'texto';

  if (c.estado.tipo === 'error') {
    return (
      <Pressable
        testID={`voz-reintentar-${m.id}`}
        accessibilityRole="button"
        accessibilityLabel={textos.voz.reintentar}
        onPress={() => {
          c._reintentar();
        }}
      >
        <Texto variante="detalle" color={color}>
          {textos.voz.reintentar}
        </Texto>
      </Pressable>
    );
  }

  const sonando = c.estado.tipo === 'reproduciendo';
  const cargando = c.estado.tipo === 'cargando';
  const colorIcono = m.mio ? tema.colores.marca : tema.colores.sobreMarca;
  return (
    <View style={estilos.fila} testID={`voz-${m.id}`}>
      <Pressable
        testID={`voz-alternar-${m.id}`}
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
          c._alternar();
        }}
        onLongPress={alMantener}
        delayLongPress={350}
        style={[estilos.boton, m.mio ? estilos.botonMio : estilos.botonOtro]}
      >
        {sonando ? (
          <IconoDetener color={colorIcono} />
        ) : (
          <IconoReproducir color={colorIcono} />
        )}
      </Pressable>
      <View
        style={[estilos.pista, m.mio ? estilos.pistaMia : estilos.pistaOtro]}
      >
        <View
          style={[
            estilos.avance,
            m.mio ? estilos.avanceMio : estilos.avanceOtro,
            { width: `${Math.round(c.progreso * 100)}%` },
          ]}
        />
      </View>
      <Texto variante="insignia" color={color}>
        {c.duracionMs === null ? '–:––' : duracionDeVoz(c.duracionMs)}
      </Texto>
    </View>
  );
}
