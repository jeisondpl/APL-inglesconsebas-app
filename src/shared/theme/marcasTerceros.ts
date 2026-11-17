import type { ModoTema } from './temas';

/**
 * Colores de marcas de TERCEROS que sus guías obligan a no recolorear. No son de Inglés con Sebas
 * (ni oficiales ni derivados): viven aquí, junto a los hex del tema, para que ninguna pantalla
 * escriba un hex.
 *
 * Google: «Sign in with Google Branding Guidelines» (botón píldora, tema claro u oscuro según el
 * fondo, la «G» a cuatro colores sin alterar).
 */
export const coloresGoogle: Record<
  ModoTema,
  { relleno: string; borde: string; texto: string }
> = {
  oscuro: { relleno: '#131314', borde: '#8E918F', texto: '#E3E3E3' },
  claro: { relleno: '#FFFFFF', borde: '#747775', texto: '#1F1F1F' },
};

/** Los cuatro colores de la «G» de Google (no se recolorean). */
export const coloresLogoGoogle = {
  rojo: '#EA4335',
  azul: '#4285F4',
  amarillo: '#FBBC05',
  verde: '#34A853',
} as const;
