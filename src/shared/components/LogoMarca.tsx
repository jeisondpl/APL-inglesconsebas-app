import Svg, { Path } from 'react-native-svg';

import { paleta, useTema } from '@/shared/theme';

import logo from '../../../assets/marca/logo.json';

export interface IPropsLogoMarca {
  /** Lado en dp. Por defecto, 48 (el viewBox de la lámina). */
  tamano?: number;
  /** Con etiqueta se anuncia como imagen; sin ella es decorativo y queda oculto al lector. */
  etiqueta?: string;
  testID?: string;
}

/**
 * Logo vectorial (burbuja y «S»), dibujado con los trazados de assets/marca/logo.json, que genera
 * `npm run marca:logo`. La burbuja va en `marca`; la «S», en `fondo` en el tema oscuro y en
 * blanco en el claro.
 */
export function LogoMarca({ tamano = 48, etiqueta, testID }: IPropsLogoMarca) {
  const { tema } = useTema();
  const colorLetra =
    tema.modo === 'oscuro' ? tema.colores.fondo : paleta.blanco;
  const accesibilidad = etiqueta
    ? {
        accessible: true,
        accessibilityRole: 'image' as const,
        accessibilityLabel: etiqueta,
      }
    : {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      };
  return (
    <Svg
      testID={testID}
      width={tamano}
      height={tamano}
      viewBox={logo.viewBox}
      {...accesibilidad}
    >
      <Path d={logo.burbuja} fill={tema.colores.marca} />
      <Path d={logo.letra} fill={colorLetra} />
    </Svg>
  );
}
