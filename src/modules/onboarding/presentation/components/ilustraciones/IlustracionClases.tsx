import Svg, { Circle, G, Path, Rect, Text } from 'react-native-svg';

import { useTema } from '@/shared/theme';

import {
  ALTO_ILUSTRACION,
  ANCHO_ILUSTRACION,
  CAJA_ILUSTRACION,
  propsDecorativas,
} from './comun';

/** O2: calendario con el día 28 y los botones de reagendar y cancelar (geometría del lienzo). */
export function IlustracionClases() {
  const { tema } = useTema();
  const c = tema.colores;
  return (
    <Svg
      testID="ilustracion-clases"
      width={ANCHO_ILUSTRACION}
      height={ALTO_ILUSTRACION}
      viewBox={CAJA_ILUSTRACION}
      fill="none"
      {...propsDecorativas}
    >
      <Rect
        x={56}
        y={34}
        width={128}
        height={118}
        rx={18}
        fill={c.superficie}
        stroke={c.borde}
      />
      <Path
        d="M56 52c0-10 8-18 18-18h92c10 0 18 8 18 18v14H56Z"
        fill={c.marca}
      />
      <Rect x={86} y={24} width={8} height={18} rx={4} fill={c.pista} />
      <Rect x={146} y={24} width={8} height={18} rx={4} fill={c.pista} />
      <Text
        x={120}
        y={114}
        textAnchor="middle"
        fontFamily={tema.familias.nohemiMedium}
        fontSize={40}
        fill={c.texto}
      >
        28
      </Text>
      <Text
        x={120}
        y={134}
        textAnchor="middle"
        fontFamily={tema.familias.dmSansRegular}
        fontSize={11}
        letterSpacing={3}
        fill={c.textoSecundario}
      >
        LUN
      </Text>
      <Circle cx={78} cy={152} r={20} fill={c.exitoSuave} />
      <G
        transform="translate(66 140)"
        stroke={c.sobreExitoSuave}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M21 12a9 9 0 1 1-3-6.7" />
        <Path d="M21 3v6h-6" />
      </G>
      <Circle cx={162} cy={152} r={20} fill={c.peligroSuave} />
      <G
        transform="translate(150 140)"
        stroke={c.peligro}
        strokeWidth={2.4}
        strokeLinecap="round"
      >
        <Path d="M6 6l12 12" />
        <Path d="M18 6 6 18" />
      </G>
    </Svg>
  );
}
