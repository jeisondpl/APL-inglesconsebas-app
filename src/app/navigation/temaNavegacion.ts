import type { Theme } from '@react-navigation/native';

import type { ITema } from '@/shared/theme';

/**
 * Tema de React Navigation a partir de los tokens. Las fuentes llevan `fontWeight: '400'` porque
 * cada peso es su propio archivo: un peso mayor haría que Android sintetizara una negrita encima.
 */
export function temaNavegacion(tema: ITema): Theme {
  const { colores, familias } = tema;
  return {
    dark: tema.modo === 'oscuro',
    colors: {
      primary: colores.marca,
      background: colores.fondo,
      card: colores.superficie,
      text: colores.texto,
      border: colores.borde,
      notification: colores.marca,
    },
    fonts: {
      regular: { fontFamily: familias.dmSansRegular, fontWeight: '400' },
      medium: { fontFamily: familias.dmSansMedium, fontWeight: '400' },
      bold: { fontFamily: familias.nohemiMedium, fontWeight: '400' },
      heavy: { fontFamily: familias.nohemiMedium, fontWeight: '400' },
    },
  };
}
