/**
 * Paleta de la Dirección A · Evolución, con los nombres de la lámina «Manual de marca resumido».
 * Las pantallas no usan la paleta directamente: usan los tokens semánticos de `temas.ts`.
 */
export const paleta = {
  verdeMarca: '#86EF86',
  verdeProfundo: '#5DDB5D',
  verdeBosque: '#1F6B1F',
  verdeMedio: '#2D8A2D',
  noche: '#05070B',
  grafito: '#0D131C',
  niebla: '#F0F4F0',
  textoClaro: '#F2F6FF',
  tinta: '#0D1A0D',
  /** Rojo aviso: #FF7B7B en oscuro y #C13333 en claro. */
  rojoAviso: '#FF7B7B',
  rojoAvisoClaro: '#C13333',
  /** Ámbar: #F5B84A en oscuro y #9A6700 en claro. */
  ambar: '#F5B84A',
  ambarClaro: '#9A6700',
  blanco: '#FFFFFF',
} as const;

export type NombreColorPaleta = keyof typeof paleta;
