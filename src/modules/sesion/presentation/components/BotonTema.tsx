import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useEstilos, useTema, type ITema } from '@/shared/theme';

import { textosSesion } from '../sesion.textos';

const crearEstilos = (tema: ITema) =>
  StyleSheet.create({
    boton: {
      width: tema.toqueMinimo,
      height: tema.toqueMinimo,
      borderRadius: tema.radios.icono,
      borderWidth: 1,
      borderColor: tema.colores.borde,
      backgroundColor: tema.colores.superficie,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulsado: { opacity: 0.7 },
  });

/**
 * Alterna entre oscuro y claro. La preferencia vive en memoria: guardarla es el ítem 1.14.
 */
export function BotonTema() {
  const { tema, establecerPreferencia } = useTema();
  const estilos = useEstilos(crearEstilos);
  const oscuro = tema.modo === 'oscuro';
  const color = tema.colores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        oscuro ? textosSesion.tema.aClaro : textosSesion.tema.aOscuro
      }
      onPress={() => establecerPreferencia(oscuro ? 'claro' : 'oscuro')}
      style={({ pressed }) => [estilos.boton, pressed && estilos.pulsado]}
    >
      {oscuro ? (
        // Sol: se pasa al tema claro.
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} />
          <Path
            d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ) : (
        // Luna: se pasa al tema oscuro.
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </Pressable>
  );
}
