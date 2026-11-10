/** Convierte `#RGB` o `#RRGGBB` a sus tres canales (0–255). Lanza si el color no es válido. */
function canales(color: string): [number, number, number] {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) {
    throw new Error(
      `relacionContraste: «${color}» no es un color hexadecimal válido (#RGB o #RRGGBB).`,
    );
  }
  const completo =
    hex.length === 3
      ? hex
          .split('')
          .map(c => c + c)
          .join('')
      : hex;
  return [0, 2, 4].map(i => parseInt(completo.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** Luminancia relativa de WCAG 2.x. */
function luminancia(color: string): number {
  const [r, g, b] = canales(color).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Relación de contraste WCAG entre dos colores, de 1 a 21. El orden no importa. Lanza un error
 * descriptivo si alguno no es un hexadecimal válido.
 */
export function relacionContraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}
