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
}

export interface ITema {
  modo: ModoTema;
  colores: IColoresTema;
  tipografia: Record<VarianteTexto, IEstiloTexto>;
  familias: typeof familias;
  espaciado: typeof espaciado;
  radios: typeof radios;
  toqueMinimo: typeof TOQUE_MINIMO;
}

/** Tema oscuro, el principal de la lámina (pantallas A-M* oscuras). */
const coloresOscuros: IColoresTema = {
  fondo: paleta.noche,
  superficie: paleta.grafito,
  superficieAlterna: '#121B27',
  campoFondo: '#0A0F16',
  borde: '#1F2A38',
  bordeMarca: '#2A5B37',
  pista: '#1B2533',
  texto: paleta.textoClaro,
  textoSecundario: '#9AA6BB',
  textoTenue: '#5A6B84',
  marca: paleta.verdeMarca,
  marcaActiva: paleta.verdeProfundo,
  acento: paleta.verdeMarca,
  sobreMarca: '#04230D',
  destacado: '#0F2A18',
  bordeDestacado: '#1E4A2B',
  exitoSuave: '#123122',
  sobreExitoSuave: '#A6F3AE',
  peligro: paleta.rojoAviso,
  peligroSuave: '#361316',
  sobrePeligroSuave: '#FFB4B4',
  bordePeligro: '#4A2226',
  aviso: paleta.ambar,
  avisoSuave: '#33260F',
  sobreAvisoSuave: paleta.ambar,
  // Provisional: el azul de `.btn-blue` de Leap. La lámina no define un azul.
  info: '#60A5FA',
};

/**
 * Tema claro (pantallas A-M* claras). Los marcados como derivados no están en la lámina: se
 * derivan de la paleta y se validan por contraste (salvedad 2 del plan).
 */
const coloresClaros: IColoresTema = {
  fondo: paleta.niebla,
  superficie: paleta.blanco,
  superficieAlterna: '#F4F8F4',
  campoFondo: paleta.blanco, // derivado
  borde: '#DBE5DB',
  bordeMarca: '#9FC5A0',
  pista: '#DCE6DC',
  texto: paleta.tinta,
  textoSecundario: '#54665A',
  // R7: los grises de la lámina (#8A9A8E y #93A497) no llegan a 3:1 sobre Niebla.
  textoTenue: '#6B7C6F',
  marca: paleta.verdeBosque,
  marcaActiva: '#174F17',
  acento: paleta.verdeMedio,
  sobreMarca: paleta.blanco,
  destacado: '#E2EFE2',
  bordeDestacado: '#C9E0C9',
  exitoSuave: '#DCEDDC',
  sobreExitoSuave: '#1C5E1C',
  peligro: paleta.rojoAvisoClaro,
  peligroSuave: '#FBE4E4', // derivado
  sobrePeligroSuave: '#9B2C2C', // derivado
  bordePeligro: '#E7B3B3', // derivado
  // R7: sobre `fondo` da 4.38, así que solo se usa en texto grande o íconos.
  aviso: paleta.ambarClaro,
  avisoSuave: '#F7ECD6', // derivado
  sobreAvisoSuave: '#7A5200', // derivado
  // Provisional: el azul de `.btn-blue` de Leap.
  info: '#2563EB',
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
