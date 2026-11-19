import { Text, type TextProps } from 'react-native';

import { useTema, type IColoresTema, type VarianteTexto } from '@/shared/theme';

export interface IPropsTexto extends TextProps {
  /** Estilo tipográfico del tema. Por defecto, `cuerpo`. */
  variante?: VarianteTexto;
  /** Token de color. Por defecto, `texto`. */
  color?: keyof IColoresTema;
}

/** Texto con la familia, el tamaño y el color del tema. Nunca usa `fontWeight`. */
export function Texto({
  variante = 'cuerpo',
  color = 'texto',
  style,
  ...resto
}: IPropsTexto) {
  const { tema } = useTema();
  return (
    <Text
      {...resto}
      style={[tema.tipografia[variante], { color: tema.colores[color] }, style]}
    />
  );
}
