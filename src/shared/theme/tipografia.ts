/**
 * Tipografía, espaciado y radios de la Dirección A. Las familias son el nombre PostScript de cada
 * TTF de assets/fuentes, que coincide con el nombre del archivo: Android busca la fuente por el
 * nombre del archivo e iOS por el PostScript. Con estas fuentes no se usa `fontWeight`: cada peso
 * es su propio archivo.
 */
export const familias = {
  soraSemiBold: 'Sora-SemiBold',
  soraBold: 'Sora-Bold',
  dmSansRegular: 'DMSans-Regular',
  dmSansMedium: 'DMSans-Medium',
  dmSansSemiBold: 'DMSans-SemiBold',
} as const;

export type VarianteTexto =
  | 'h1'
  | 'h2'
  | 'titulo'
  | 'subtitulo'
  | 'cuerpo'
  | 'cuerpoFuerte'
  | 'boton'
  | 'detalle'
  | 'etiqueta'
  | 'insignia';

export interface IEstiloTexto {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  /** Solo `etiqueta`: la lámina la escribe en mayúsculas. */
  textTransform?: 'uppercase';
}

export const tipografia: Record<VarianteTexto, IEstiloTexto> = {
  h1: { fontFamily: familias.soraBold, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: familias.soraBold, fontSize: 20, lineHeight: 26 },
  titulo: { fontFamily: familias.soraBold, fontSize: 17, lineHeight: 22 },
  subtitulo: {
    fontFamily: familias.soraSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  cuerpo: { fontFamily: familias.dmSansRegular, fontSize: 15, lineHeight: 22 },
  cuerpoFuerte: {
    fontFamily: familias.dmSansSemiBold,
    fontSize: 13.5,
    lineHeight: 18,
  },
  boton: { fontFamily: familias.soraSemiBold, fontSize: 14, lineHeight: 18 },
  detalle: { fontFamily: familias.dmSansRegular, fontSize: 12, lineHeight: 16 },
  etiqueta: {
    fontFamily: familias.soraBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  insignia: {
    fontFamily: familias.dmSansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
};

export const espaciado = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Radios de la lámina: 16 en botones y campos, 20 en tarjetas, 26 en héroes y 12 en íconos. */
export const radios = {
  icono: 12,
  boton: 16,
  campo: 16,
  tarjeta: 20,
  heroe: 26,
  pildora: 999,
} as const;

/** Área táctil mínima (docs/ARQUITECTURA.md § 8). */
export const TOQUE_MINIMO = 44 as const;
