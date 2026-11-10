import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { ColorSchemeName } from 'react-native';

/**
 * Tema de React Navigation según el esquema del sistema: oscuro solo si es `dark`. Es provisional:
 * la feature de sistema de diseño lo sustituirá por los tokens del manual de marca.
 */
export function temaNavegacion(esquema: ColorSchemeName | null): Theme {
  return esquema === 'dark' ? DarkTheme : DefaultTheme;
}
