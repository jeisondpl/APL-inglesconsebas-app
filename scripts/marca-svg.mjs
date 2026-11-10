// Utilidades compartidas por los generadores de marca (generar-logo, generar-iconos y
// generar-splash). La única fuente de verdad es assets/marca/logo.json, que escribe generar-logo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
export const RUTA_LOGO_JSON = path.join(RAIZ, 'assets', 'marca', 'logo.json');

/** Lee assets/marca/logo.json. Falla con un mensaje claro si aún no se generó. */
export function leerLogo() {
  if (!fs.existsSync(RUTA_LOGO_JSON)) {
    throw new Error(
      'No existe assets/marca/logo.json. Ejecuta primero `npm run marca:logo`.',
    );
  }
  return JSON.parse(fs.readFileSync(RUTA_LOGO_JSON, 'utf8'));
}

/**
 * Escribe `contenido` solo si cambia, para que ejecutar un generador dos veces deje `git status`
 * limpio y no toque las fechas de los archivos. Devuelve true si escribió.
 */
export function escribirSiCambia(ruta, contenido) {
  const nuevo = Buffer.isBuffer(contenido)
    ? contenido
    : Buffer.from(contenido, 'utf8');
  if (fs.existsSync(ruta) && fs.readFileSync(ruta).equals(nuevo)) {
    return false;
  }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, nuevo);
  console.log(`  escrito ${path.relative(RAIZ, ruta).replace(/\\/g, '/')}`);
  return true;
}

/** JSON con 2 espacios y salto final (el formato que deja Prettier en objetos). */
export const aJson = valor => `${JSON.stringify(valor, null, 2)}\n`;

const num = n => Number(n.toFixed(3)).toString();

/**
 * Grupo SVG con la burbuja y la «S» del logo, escalado a `tamano` px y desplazado a (x, y).
 * `colores` = { burbuja, letra }. Con `letra: null` la «S» se cala en la burbuja (evenodd).
 */
export function grupoLogo(logo, { x = 0, y = 0, tamano = 48, colores }) {
  const transformacion = `translate(${num(x)} ${num(y)}) scale(${num(
    tamano / 48,
  )})`;
  if (colores.letra === null) {
    return `<g transform="${transformacion}"><path d="${logo.burbuja} ${logo.letra}" fill="${colores.burbuja}" fill-rule="evenodd"/></g>`;
  }
  return `<g transform="${transformacion}"><path d="${logo.burbuja}" fill="${colores.burbuja}"/><path d="${logo.letra}" fill="${colores.letra}"/></g>`;
}

/** Documento SVG de `ancho`×`alto` con el contenido dado (sin texto: solo trazados). */
export function svg(ancho, alto, contenido) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">${contenido}</svg>\n`;
}

/** Logo de 48×48 (viewBox de la lámina) en la variante `oscuro` o `claro`. */
export function svgLogo(logo, variante) {
  const c = logo.colores[variante];
  return svg(
    48,
    48,
    grupoLogo(logo, { colores: { burbuja: c.burbuja, letra: c.letra } }),
  );
}

/**
 * Logo del splash (lámina A-M0): cuadrado de 120×120 con radio 26 y borde de 1 px, y la burbuja de
 * 66 px centrada. `escala` multiplica todo (densidades de Android e iOS).
 */
export function svgSplash(logo, variante, escala = 1) {
  const c = logo.colores[variante];
  const lado = 120 * escala;
  const borde = 1 * escala;
  const tamanoBurbuja = 66 * escala;
  const inicio = (lado - tamanoBurbuja) / 2;
  const cuadrado =
    `<rect x="${num(borde / 2)}" y="${num(borde / 2)}"` +
    ` width="${num(lado - borde)}" height="${num(lado - borde)}"` +
    ` rx="${num(26 * escala - borde / 2)}" fill="${c.cuadrado}"` +
    ` stroke="${c.bordeCuadrado}" stroke-width="${num(borde)}"/>`;
  return svg(
    lado,
    lado,
    cuadrado +
      grupoLogo(logo, {
        x: inicio,
        y: inicio,
        tamano: tamanoBurbuja,
        colores: { burbuja: c.burbuja, letra: c.letra },
      }),
  );
}
