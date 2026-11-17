/**
 * Tokens de movimiento (F1-04). Duraciones y resortes copiados del login de APL-Livic-movil para que
 * todas las pantallas compartan el mismo lenguaje: entradas de 420 ms con resorte suave, escala al
 * pulsar con resorte firme y sacudida de 5 golpes de 55 ms.
 */
export const duraciones = {
  /** Entrada estándar (Revelar): fundido de la opacidad. */
  entrada: 420,
  /** Fundido corto: lo único que queda con reduce-motion. */
  fundidoCorto: 200,
  /** Cambio de foco de un campo (borde de 1 a 2 px). */
  foco: 150,
  /** Un golpe de la sacudida. */
  golpeSacudida: 55,
  /** Medio ciclo de la respiración del halo. */
  respiracionHalo: 1600,
  /** Medio ciclo de la respiración del logo en la carga. */
  respiracionLogo: 900,
  /** Una vuelta del anillo de carga. */
  giroAnillo: 1100,
  /** Puntos del PIN en rojo antes de vaciarse. */
  errorPin: 300,
} as const;

/** Resortes de Reanimated (`withSpring`). */
export const resortes = {
  /** Entrada de un bloque (Revelar). */
  entrada: { damping: 16, stiffness: 140 },
  /** Escala al pulsar un botón o una tecla. */
  presion: { damping: 14, stiffness: 220 },
  /** El logo que aterriza en el splash. */
  logo: { damping: 12, stiffness: 120 },
} as const;

/** Desplazamiento inicial de una entrada (translateY 20 → 0). */
export const DESPLAZAMIENTO_ENTRADA = 20;

/** Escala de un control mientras se mantiene pulsado. */
export const ESCALA_PRESION = 0.97;

/** Golpes de la sacudida horizontal, en dp. El último vuelve al centro. */
export const GOLPES_SACUDIDA = [-8, 8, -6, 6, 0] as const;

/** Escala máxima de la respiración del halo (1 ↔ 1.08). */
export const ESCALA_HALO = 1.08;

/** Escala máxima de la respiración del logo en la carga (1 ↔ 1.06). */
export const ESCALA_LOGO_CARGA = 1.06;
