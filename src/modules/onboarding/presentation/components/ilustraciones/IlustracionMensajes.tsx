import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useTema } from '@/shared/theme';

import {
  ALTO_ILUSTRACION,
  ANCHO_ILUSTRACION,
  CAJA_ILUSTRACION,
  propsDecorativas,
} from './comun';

/** Barras de la nota de voz: [x, y, alto, reproducida]. */
const ONDAS: readonly (readonly [number, number, number, boolean])[] = [
  [72, 65, 10, true],
  [80, 61, 18, true],
  [88, 58, 24, true],
  [96, 63, 14, false],
  [104, 60, 20, false],
  [112, 64, 12, false],
];

/** O3: nota de voz, burbuja con una imagen y el micrófono (geometría del lienzo). */
export function IlustracionMensajes() {
  const { tema } = useTema();
  const c = tema.colores;
  return (
    <Svg
      testID="ilustracion-mensajes"
      width={ANCHO_ILUSTRACION}
      height={ALTO_ILUSTRACION}
      viewBox={CAJA_ILUSTRACION}
      fill="none"
      {...propsDecorativas}
    >
      <Rect
        x={28}
        y={44}
        width={122}
        height={52}
        rx={16}
        fill={c.superficie}
        stroke={c.borde}
      />
      <Circle cx={52} cy={70} r={12} fill={c.marca} />
      <Path d="M49 64.5v11l9-5.5Z" fill={c.sobreMarca} />
      {ONDAS.map(([x, y, alto, reproducida]) => (
        <Rect
          key={x}
          x={x}
          y={y}
          width={4}
          height={alto}
          rx={2}
          fill={reproducida ? c.marca : c.textoTenue}
        />
      ))}
      <Rect
        x={104}
        y={106}
        width={106}
        height={50}
        rx={16}
        fill={c.exitoSuave}
      />
      <Path d="M186 156v12l12-12Z" fill={c.exitoSuave} />
      <G
        transform="translate(144 118)"
        stroke={c.sobreExitoSuave}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Rect x={3.5} y={4.5} width={17} height={15} rx={2.5} />
        <Circle cx={9} cy={10} r={1.8} />
        <Path d="M20.5 15.5 15 10l-8 9" />
      </G>
      <Circle cx={186} cy={38} r={18} fill={c.marca} />
      <G
        transform="translate(174 26)"
        stroke={c.sobreMarca}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Rect x={9} y={3} width={6} height={11} rx={3} />
        <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
        <Path d="M12 18v3" />
      </G>
    </Svg>
  );
}
