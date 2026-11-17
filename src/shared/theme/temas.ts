import { paleta } from './paleta';
import {
  espaciado,
  familias,
  radios,
  tipografia,
  TOQUE_MINIMO,
  type IEstiloTexto,
  type VarianteTexto,
} from './tipografia';

export type ModoTema = 'claro' | 'oscuro';
export type PreferenciaTema = ModoTema | 'sistema';

/**
 * Tema con el que arranca la app mientras no se guarde la preferencia del usuario (ítem 1.14).
 * Decisión P1 del plan de F1-01b: se sigue al sistema; si el sistema no informa, oscuro.
 */
export const PREFERENCIA_TEMA_POR_DEFECTO: PreferenciaTema = 'sistema';

/** Tokens semánticos de color. Los dos temas tienen exactamente las mismas claves. */
export interface IColoresTema {
  fondo: string;
  superficie: string;
  superficieAlterna: string;
  campoFondo: string;
  borde: string;
  bordeMarca: string;
  pista: string;
  texto: string;
  textoSecundario: string;
  textoTenue: string;
  marca: string;
  marcaActiva: string;
  acento: string;
  sobreMarca: string;
  destacado: string;
  bordeDestacado: string;
  exitoSuave: string;
  sobreExitoSuave: string;
  peligro: string;
  peligroSuave: string;
  sobrePeligroSuave: string;
  bordePeligro: string;
  aviso: string;
  avisoSuave: string;
  sobreAvisoSuave: string;
  info: string;
  /** Botón confirmar del teclado de PIN: verde oficial en los dos temas (F1-03, P8). */
  confirmar: string;
  sobreConfirmar: string;
  /**
   * Halo de marca del fondo animado (F1-04): el verde oficial en los dos temas. Se pinta con
   * opacidad baja (gradiente radial), así que no compite con el texto.
   */
  halo: string;
  /**
   * Velo bajo una hoja inferior o un modal (F1-05): negro en los dos temas, pintado al 60 % de
   * opacidad (`OPACIDAD_VELO`), como pide el patrón «Modal / bottom sheet» de la skill de marca.
   */
  velo: string;
}

/** Opacidad del velo bajo una hoja inferior (patrón de la skill de marca: negro al 60 %). */
export const OPACIDAD_VELO = 0.6;

export interface ITema {
  modo: ModoTema;
  colores: IColoresTema;
  tipografia: Record<VarianteTexto, IEstiloTexto>;
  familias: typeof familias;
  espaciado: typeof espaciado;
  radios: typeof radios;
  toqueMinimo: typeof TOQUE_MINIMO;
}

/**
 * Tema oscuro (manual de marca, p. 3: logo claro sobre negro). Fondo negro, texto blanco, gris
 * oficial para el texto secundario y verde oficial como marca. Superficies, bordes y estados no
 * están en el kit: son derivados neutros que conviven con la paleta.
 */
const coloresOscuros: IColoresTema = {
  fondo: paleta.negro,
  superficie: '#0E1210', // derivado
  superficieAlterna: '#161B18', // derivado
  campoFondo: '#0A0D0B', // derivado
  borde: '#262D29', // derivado
  bordeMarca: '#2A5B37', // derivado
  pista: '#1E2420', // derivado
  texto: paleta.blanco,
  textoSecundario: paleta.gris,
  textoTenue: '#6F7A72', // derivado del gris oficial
  marca: paleta.verde,
  marcaActiva: paleta.verdeProfundo,
  acento: paleta.verde,
  sobreMarca: paleta.negro,
  destacado: '#0F2A18', // derivado
  bordeDestacado: '#1E4A2B', // derivado
  exitoSuave: '#123122', // derivado
  sobreExitoSuave: '#A6F3AE', // derivado
  peligro: paleta.rojoAviso,
  peligroSuave: '#361316', // derivado
  sobrePeligroSuave: '#FFB4B4', // derivado
  bordePeligro: '#4A2226', // derivado
  aviso: paleta.ambar,
  avisoSuave: '#33260F', // derivado
  sobreAvisoSuave: paleta.ambar,
  // Provisional: el azul de `.btn-blue` de Leap. El kit no define un azul.
  info: '#60A5FA',
  confirmar: paleta.verde,
  sobreConfirmar: paleta.negro,
  halo: paleta.verde,
  velo: paleta.negro, // derivado: velo de hoja inferior, al 60 %
};

/**
 * Tema claro (manual de marca, p. 4: logo gris sobre blanco). Fondo y superficie blancos (las
 * tarjetas se separan por el borde), texto negro y el gris del logo para el texto secundario. El
 * verde oficial no llega a 4.5:1 sobre blanco, así que `marca` es un verde bosque derivado.
 */
const coloresClaros: IColoresTema = {
  fondo: paleta.blanco,
  superficie: paleta.blanco,
  superficieAlterna: '#F2F5F2', // derivado
  campoFondo: paleta.blanco,
  borde: '#DCE2DC', // derivado
  bordeMarca: '#9FC5A0', // derivado
  pista: '#E1E6E1', // derivado
  texto: paleta.negro,
  textoSecundario: paleta.grisLogo,
  // El gris oficial da 2.2:1 sobre blanco: se oscurece para llegar a 3:1.
  textoTenue: '#7A857C', // derivado
  marca: paleta.verdeBosque,
  marcaActiva: '#174F17', // derivado
  acento: paleta.verdeMedio,
  sobreMarca: paleta.blanco,
  destacado: '#E6F2E6', // derivado
  bordeDestacado: '#C9E0C9', // derivado
  exitoSuave: '#DCEDDC', // derivado
  sobreExitoSuave: '#1C5E1C', // derivado
  peligro: paleta.rojoAvisoClaro,
  peligroSuave: '#FBE4E4', // derivado
  sobrePeligroSuave: '#9B2C2C', // derivado
  bordePeligro: '#E7B3B3', // derivado
  aviso: paleta.ambarClaro,
  avisoSuave: '#F7ECD6', // derivado
  sobreAvisoSuave: '#7A5200', // derivado
  // Provisional: el azul de `.btn-blue` de Leap.
  info: '#2563EB',
  // El verde oficial con check negro también en claro (lienzo del login, P8).
  confirmar: paleta.verde,
  sobreConfirmar: paleta.negro,
  halo: paleta.verde,
  velo: paleta.negro, // derivado: velo de hoja inferior, al 60 %
};

const base: Omit<ITema, 'modo' | 'colores'> = {
  tipografia,
  familias,
  espaciado,
  radios,
  toqueMinimo: TOQUE_MINIMO,
};

export const temaOscuro: ITema = {
  modo: 'oscuro',
  colores: coloresOscuros,
  ...base,
};

export const temaClaro: ITema = {
  modo: 'claro',
  colores: coloresClaros,
  ...base,
};

export const temas: Record<ModoTema, ITema> = {
  oscuro: temaOscuro,
  claro: temaClaro,
};
