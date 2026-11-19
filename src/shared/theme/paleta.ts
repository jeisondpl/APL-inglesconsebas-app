/**
 * Paleta del kit de marca oficial de Inglés con Sebas (manual de marca, p. 7): blanco, negro,
 * verde y gris. Se añaden el gris del logo sobre blanco (manual, p. 4) y los colores derivados que
 * el kit no define (verde para fondo claro y colores de estado), marcados como tales.
 * Las pantallas no usan la paleta directamente: usan los tokens semánticos de `temas.ts`.
 */
export const paleta = {
  // Oficiales (manual, p. 7)
  blanco: '#FFFFFF',
  negro: '#000000',
  verde: '#86EF86',
  gris: '#A5AFA5',
  // Manual, p. 4: el logo gris sobre blanco.
  grisLogo: '#62696B',
  // Derivados: el verde oficial no llega a 4.5:1 sobre blanco.
  verdeProfundo: '#5DDB5D',
  verdeBosque: '#1F6B1F',
  verdeMedio: '#2D8A2D',
  // Derivados: estados (peligro y aviso) en oscuro y en claro.
  rojoAviso: '#FF7B7B',
  rojoAvisoClaro: '#C13333',
  ambar: '#F5B84A',
  ambarClaro: '#9A6700',
} as const;

export type NombreColorPaleta = keyof typeof paleta;
