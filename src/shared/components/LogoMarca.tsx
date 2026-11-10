import Svg, { Path } from 'react-native-svg';

import logo from '../../../assets/marca/logo.json';

export type CategoriaIsotipo = keyof typeof logo.colores.isotipo;

export interface IPropsLogoMarca {
  /** Lado en dp. Por defecto, 48. */
  tamano?: number;
  /** corporate (círculo negro), self (gris) o kids (verde). Manual de marca, pp. 9–10. */
  categoria?: CategoriaIsotipo;
  /** Con etiqueta se anuncia como imagen; sin ella es decorativo y queda oculto al lector. */
  etiqueta?: string;
  testID?: string;
}

const { capas, viewBox } = logo.isotipo;

/**
 * Isotipo oficial (la mano «OK» en el círculo con la «S»), dibujado con los trazados vectoriales
 * de assets/marca/logo.json, que extrae scripts/extraer-logo-kit.py del kit de marca. Sus colores
 * son los de la categoría, no los del tema.
 */
export function LogoMarca({
  tamano = 48,
  categoria = 'corporate',
  etiqueta,
  testID,
}: IPropsLogoMarca) {
  const colores = logo.colores.isotipo[categoria];
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
      viewBox={viewBox}
      {...accesibilidad}
    >
      <Path d={capas.circulo} fill={colores.circulo} />
      <Path d={capas.manoContorno} fill={colores.manoContorno} />
      {/* El relleno de la mano es del color del círculo: solo se ve el contorno blanco. */}
      <Path d={capas.manoRelleno} fill={colores.circulo} />
      <Path d={capas.letra} fill={colores.letra} />
    </Svg>
  );
}
