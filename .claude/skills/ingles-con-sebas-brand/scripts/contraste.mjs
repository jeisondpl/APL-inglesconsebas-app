// ingles-con-sebas-brand · scripts/contraste.mjs — v1.0.0 · 2026-11-17
// Relación de contraste WCAG 2.x entre dos colores (misma fórmula que src/shared/theme/contraste.ts).
// Uso: node contraste.mjs '#86EF86' '#000000' [más pares…]
function canales(color) {
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (!hex) throw new Error(`«${color}» no es un hexadecimal válido`);
  const h = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
const lum = c =>
  canales(c)
    .map(v => v / 255)
    .map(s => (s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4))
    .reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error("Uso: node contraste.mjs '#frente' '#fondo' [...]");
  process.exit(2);
}
for (let i = 0; i < args.length; i += 2) {
  const r = ratio(args[i], args[i + 1]);
  const v =
    r >= 7
      ? 'AAA'
      : r >= 4.5
      ? 'AA'
      : r >= 3
      ? 'solo texto grande / bordes (3:1)'
      : 'NO PASA';
  console.log(`${args[i]} sobre ${args[i + 1]}: ${r.toFixed(2)}:1 → ${v}`);
}
