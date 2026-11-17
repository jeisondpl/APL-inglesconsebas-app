import Svg, { Path } from 'react-native-svg';

import { textosComunes } from '@/shared/lib/textos';
import { useTema } from '@/shared/theme';

import logo from '../../../assets/marca/logo.json';

export interface IPropsMarca {
  /** Ancho en dp. Por defecto, 220. El alto sale de la proporción del logo. */
  ancho?: number;
  /** Se anuncia como encabezado de la pantalla. */
  esEncabezado?: boolean;
  testID?: string;
}

const { capas, viewBox } = logo.logo;
const [, , anchoVista, altoVista] = viewBox.split(' ').map(Number);

/**
 * Logo principal oficial: la mano «OK» y «Inglés con sebas», vectorial (assets/marca/logo.json).
 * En el tema oscuro va claro (manual, p. 3) y en el claro, gris (p. 4). Se lee como una unidad:
 * «Inglés con Sebas».
 */
export function Marca({
  ancho = 220,
  esEncabezado = false,
  testID,
}: IPropsMarca) {
  const { tema } = useTema();
  const colores = logo.colores[tema.modo];
  return (
    <Svg
      testID={testID}
      width={ancho}
      height={(ancho * altoVista) / anchoVista}
      viewBox={viewBox}
      accessible
      accessibilityRole={esEncabezado ? 'header' : 'image'}
      accessibilityLabel={textosComunes.marca.nombre}
    >
      <Path d={capas.manoContorno} fill={colores.manoContorno} />
      <Path d={capas.manoRelleno} fill={colores.manoRelleno} />
      <Path d={capas.nombre} fill={colores.nombre} />
      <Path d={capas.con} fill={colores.con} />
    </Svg>
  );
}
