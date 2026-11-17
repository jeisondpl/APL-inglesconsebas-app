/** Tamaño de las ilustraciones O2–O4 del lienzo (viewBox 0 0 240 190). */
export const ANCHO_ILUSTRACION = 240;
export const ALTO_ILUSTRACION = 190;
export const CAJA_ILUSTRACION = `0 0 ${ANCHO_ILUSTRACION} ${ALTO_ILUSTRACION}`;

/** Las ilustraciones son decorativas: quedan ocultas al lector de pantalla (CA14). */
export const propsDecorativas = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
} as const;
