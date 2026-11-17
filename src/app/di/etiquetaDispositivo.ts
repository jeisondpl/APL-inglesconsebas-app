import { Platform } from 'react-native';

/** Lo que se usa de `Platform` (inyectable en los tests). */
export interface IInfoPlataforma {
  OS: string;
  Version: string | number;
  constants?: {
    Brand?: string;
    Model?: string;
    Release?: string;
  };
}

const MAXIMO = 100;

/**
 * Etiqueta del dispositivo para auth_sessions (Leap la corta a 100): «<Marca> <Modelo> · Android
 * <versión>» o «iOS <versión>». Sin datos del modelo, solo el sistema.
 */
export function etiquetaDispositivo(
  info: IInfoPlataforma = Platform as unknown as IInfoPlataforma,
): string {
  let etiqueta: string;
  if (info.OS === 'android') {
    const { Brand, Model, Release } = info.constants ?? {};
    const equipo = [Brand, Model].filter(Boolean).join(' ');
    const sistema = `Android ${Release ?? info.Version}`;
    etiqueta = equipo ? `${equipo} · ${sistema}` : sistema;
  } else if (info.OS === 'ios') {
    etiqueta = `iOS ${info.Version}`;
  } else {
    etiqueta = `${info.OS} ${info.Version}`;
  }
  return etiqueta.slice(0, MAXIMO);
}
