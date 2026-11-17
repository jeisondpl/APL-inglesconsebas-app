import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Íconos de trazo de la App (F1-05). Mismo estilo que los de lucide que usa Livic (cuadrícula de
 * 24, trazo 1.75 redondeado) pero dibujados aquí con react-native-svg: los trazados son los del
 * lienzo aprobado (A-M2). El color siempre llega de un token del tema.
 */
export interface IPropsIcono {
  /** Lado en dp. Por defecto, 22. */
  tamano?: number;
  /** Color del trazo (un valor de `tema.colores`). */
  color: string;
  /** Grosor del trazo. Por defecto, 1.75 (como Livic). */
  grosor?: number;
  testID?: string;
}

export const GROSOR_ICONO = 1.75;

export type ComponenteIcono = (props: IPropsIcono) => ReactNode;

function Base({
  tamano = 22,
  color,
  grosor = GROSOR_ICONO,
  testID,
  children,
}: IPropsIcono & { children: ReactNode }) {
  return (
    <Svg
      testID={testID}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export function IconoInicio(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Path d="M3 11.5 12 4l9 7.5" />
      <Path d="M5.5 10.5V20h13v-9.5" />
    </Base>
  );
}

export function IconoClases(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={2.5} />
      <Path d="M3.5 9.5h17" />
      <Path d="M8.5 3v4" />
      <Path d="M15.5 3v4" />
    </Base>
  );
}

export function IconoMensajes(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Base>
  );
}

export function IconoTareas(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </Base>
  );
}

export function IconoReloj(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Base>
  );
}

export function IconoFlecha(props: IPropsIcono) {
  return (
    <Base {...props}>
      <Path d="M9 6l6 6-6 6" />
    </Base>
  );
}
