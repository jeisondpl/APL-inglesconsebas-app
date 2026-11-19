// Utilidades compartidas por los generadores de marca (generar-logo, generar-iconos y
// generar-splash). La única fuente de verdad es assets/marca/logo.json, que escribe
// scripts/extraer-logo-kit.py a partir de los PDF vectoriales del kit oficial.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
export const RUTA_LOGO_JSON = path.join(RAIZ, 'assets', 'marca', 'logo.json');

/** Lee assets/marca/logo.json. Falla con un mensaje claro si aún no se extrajo. */
export function leerLogo() {
  if (!fs.existsSync(RUTA_LOGO_JSON)) {
    throw new Error(
      'No existe assets/marca/logo.json. Ejecuta primero `python scripts/extraer-logo-kit.py`.',
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

/** Ancho y alto del viewBox `0 0 ancho alto`. */
export function medidas(viewBox) {
  const [, , ancho, alto] = viewBox.split(' ').map(Number);
  return { ancho, alto };
}

/** Documento SVG de `ancho`×`alto` con el contenido dado (sin texto: solo trazados). */
export function svg(ancho, alto, contenido) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${num(
    ancho,
  )}" height="${num(alto)}" viewBox="0 0 ${num(ancho)} ${num(
    alto,
  )}">${contenido}</svg>\n`;
}

const grupo = (x, y, escala, contenido) =>
  `<g transform="translate(${num(x)} ${num(y)}) scale(${num(
    escala,
  )})">${contenido}</g>`;

const trazado = (d, fill, reglaParImpar = false) =>
  `<path d="${d}" fill="${fill}"${
    reglaParImpar ? ' fill-rule="evenodd"' : ''
  }/>`;

/**
 * Logo principal (mano «OK» + «Inglés con sebas») en la variante `oscuro` o `claro`, con `ancho`
 * px y su esquina en (x, y).
 */
export function grupoLogo(logo, variante, { x = 0, y = 0, ancho }) {
  const c = logo.colores[variante];
  const { capas, viewBox } = logo.logo;
  const escala = ancho / medidas(viewBox).ancho;
  return grupo(
    x,
    y,
    escala,
    trazado(capas.manoContorno, c.manoContorno) +
      trazado(capas.manoRelleno, c.manoRelleno) +
      trazado(capas.nombre, c.nombre) +
      trazado(capas.con, c.con),
  );
}

/** Alto del logo principal cuando mide `ancho`. */
export function altoLogo(logo, ancho) {
  const { ancho: a, alto } = medidas(logo.logo.viewBox);
  return (ancho * alto) / a;
}

/**
 * Isotipo (mano en el círculo con la «S») de lado `lado`, en (x, y).
 * - `categoria`: corporate (negro), self (gris) o kids (verde), manual pp. 9–10.
 * - `sinCirculo`: solo la mano y la «S» (capa delantera del ícono adaptativo).
 * - `monocromo`: silueta de un color (`colorMonocromo`) con el relleno y la «S» calados
 *   (evenodd), para el ícono temático de Android.
 */
export function grupoIsotipo(
  logo,
  {
    x = 0,
    y = 0,
    lado,
    categoria = 'corporate',
    sinCirculo = false,
    monocromo = false,
    colorMonocromo = '#FFFFFF',
  },
) {
  const { capas, viewBox } = logo.isotipo;
  const escala = lado / medidas(viewBox).ancho;
  if (monocromo) {
    return grupo(
      x,
      y,
      escala,
      trazado(
        `${capas.manoContorno}${capas.manoRelleno}${capas.letra}`,
        colorMonocromo,
        true,
      ),
    );
  }
  const c = logo.colores.isotipo[categoria];
  return grupo(
    x,
    y,
    escala,
    (sinCirculo ? '' : trazado(capas.circulo, c.circulo)) +
      trazado(capas.manoContorno, c.manoContorno) +
      // El relleno de la mano es del color del círculo: deja ver solo el contorno blanco.
      trazado(capas.manoRelleno, c.circulo) +
      trazado(capas.letra, c.letra),
  );
}

/** Logo principal solo, a tamaño natural del viewBox. */
export function svgLogo(logo, variante) {
  const { ancho, alto } = medidas(logo.logo.viewBox);
  return svg(ancho, alto, grupoLogo(logo, variante, { ancho }));
}

/** Isotipo solo, a tamaño natural del viewBox. */
export function svgIsotipo(logo, categoria) {
  const { ancho } = medidas(logo.isotipo.viewBox);
  return svg(ancho, ancho, grupoIsotipo(logo, { lado: ancho, categoria }));
}
