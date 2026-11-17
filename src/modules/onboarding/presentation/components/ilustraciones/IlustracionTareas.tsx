import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTema } from '@/shared/theme';

import {
  ALTO_ILUSTRACION,
  ANCHO_ILUSTRACION,
  CAJA_ILUSTRACION,
  propsDecorativas,
} from './comun';

/** Líneas de la hoja: [y, ancho]. */
const LINEAS: readonly (readonly [number, number])[] = [
  [46, 62],
  [62, 72],
  [78, 50],
  [94, 66],
];

/** Puntos de la burbuja de feedback (cx). */
const PUNTOS = [165, 175, 185] as const;

/** O4: hoja de la tarea entregada con el check y la burbuja de feedback (geometría del lienzo). */
export function IlustracionTareas() {
  const { tema } = useTema();
  const c = tema.colores;
  return (
    <Svg
      testID="ilustracion-tareas"
      width={ANCHO_ILUSTRACION}
      height={ALTO_ILUSTRACION}
      viewBox={CAJA_ILUSTRACION}
      fill="none"
      {...propsDecorativas}
    >
      <Rect
        x={72}
        y={26}
        width={98}
        height={126}
        rx={14}
        fill={c.superficie}
        stroke={c.borde}
      />
      {LINEAS.map(([y, ancho]) => (
        <Rect
          key={y}
          x={86}
          y={y}
          width={ancho}
          height={6}
          rx={3}
          fill={c.pista}
        />
      ))}
      <Circle cx={88} cy={142} r={21} fill={c.marca} />
      <Path
        d="M79.5 142.5l6 6 11.5-12.5"
        stroke={c.sobreMarca}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={146} y={84} width={58} height={40} rx={13} fill={c.exitoSuave} />
      <Path d="M158 124v10l10-10Z" fill={c.exitoSuave} />
      {PUNTOS.map(cx => (
        <Circle key={cx} cx={cx} cy={104} r={3} fill={c.sobreExitoSuave} />
      ))}
    </Svg>
  );
}
