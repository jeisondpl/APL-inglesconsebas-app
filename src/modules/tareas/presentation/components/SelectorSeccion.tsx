import { Pressable, StyleSheet, View } from 'react-native';

import { Texto } from '@/shared/components';
import { useEstilos, type ITema } from '@/shared/theme';

import type { SeccionTareas } from '../../domain/entities/Tareas.entities';
import { textosTareas as textos } from '../tareas.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      gap: tema.espaciado.s,
      paddingHorizontal: tema.espaciado.xl,
      paddingVertical: tema.espaciado.s,
    },
    chip: {
      minHeight: tema.toqueMinimo,
      paddingHorizontal: tema.espaciado.l,
      borderRadius: tema.radios.boton,
      borderWidth: 1.5,
      borderColor: tema.colores.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActivo: {
      backgroundColor: tema.colores.marca,
      borderColor: tema.colores.marca,
    },
  });

/** Chips de las secciones de la lista, cada uno con cuántas tareas tiene. */
export function SelectorSeccion({
  secciones,
  activa,
  conteo,
  alElegir,
}: {
  secciones: SeccionTareas[];
  activa: SeccionTareas;
  conteo: Record<SeccionTareas, number>;
  alElegir: (s: SeccionTareas) => void;
}) {
  const estilos = useEstilos(crearEstilos);
  return (
    <View style={estilos.fila} accessibilityRole="tablist">
      {secciones.map(s => {
        const seleccionada = s === activa;
        return (
          <Pressable
            key={s}
            testID={`tareas-seccion-${s}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: seleccionada }}
            accessibilityLabel={`${textos.secciones[s]}, ${conteo[s]}`}
            onPress={() => alElegir(s)}
            style={[estilos.chip, seleccionada && estilos.chipActivo]}
          >
            <Texto
              variante="cuerpoFuerte"
              color={seleccionada ? 'sobreMarca' : 'texto'}
            >
              {`${textos.secciones[s]} ${conteo[s]}`}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}
