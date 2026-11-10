// Genera el logo vectorial de la Dirección A (lámina «Manual de marca resumido», LOGO PROVISIONAL):
// la burbuja de diálogo y la «S» en Sora ExtraBold (800), convertida a trazado con opentype.js.
//
// Por qué se vectoriza la «S»: sharp rasteriza SVG con librsvg, que busca la fuente por fontconfig.
// Sora no está instalada en Windows ni en CI, así que un <text> saldría en otra fuente o vacío.
// Se convierte una vez y se versiona el resultado: assets/marca/logo.json es la fuente de verdad
// de LogoMarca, de los íconos (generar-iconos.mjs) y del splash (generar-splash.mjs).
//
// Uso: npm run marca:logo   (idempotente: si nada cambia, no escribe)
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

import {
  RAIZ,
  RUTA_LOGO_JSON,
  aJson,
  escribirSiCambia,
  svgLogo,
  svgSplash,
} from './marca-svg.mjs';

// Datos de la lámina (Main.dc.html): viewBox 0 0 48 48, <text x="24" y="27.5"
// text-anchor="middle" font-size="19" font-weight="800">S</text>.
const BURBUJA =
  'M10 4h28c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H22l-9 9v-9h-3c-4.4 0-8-3.6-8-8V12c0-4.4 3.6-8 8-8Z';
const LETRA = { caracter: 'S', x: 24, y: 27.5, tamano: 19 };

// Colores de la lámina. «oscuro» y «claro» son las dos variantes del logo y del cuadrado del
// splash (A-M0 oscuro y claro); `fondo` es el fondo del splash y `fondoIcono` el del ícono.
const COLORES = {
  oscuro: {
    burbuja: '#86EF86',
    letra: '#05070B',
    cuadrado: '#0D131C',
    bordeCuadrado: '#263140',
    fondo: '#05070B',
  },
  claro: {
    burbuja: '#1F6B1F',
    letra: '#FFFFFF',
    cuadrado: '#FFFFFF',
    bordeCuadrado: '#DBE5DB',
    fondo: '#F0F4F0',
  },
  fondoIcono: '#05070B',
};

const RUTA_FUENTE = path.join(
  RAIZ,
  'assets',
  'marca',
  'fuentes-origen',
  'Sora-ExtraBold.ttf',
);

const fuente = opentype.parse(fs.readFileSync(RUTA_FUENTE).buffer);
const nombrePs = fuente.names.windows?.postScriptName?.en;
if (nombrePs !== 'Sora-ExtraBold') {
  throw new Error(
    `La fuente de origen no es Sora-ExtraBold (nombre PostScript: ${nombrePs}).`,
  );
}

// text-anchor="middle": el punto x es el centro del avance de la letra.
const glifo = fuente.charToGlyph(LETRA.caracter);
const avance = (glifo.advanceWidth * LETRA.tamano) / fuente.unitsPerEm;
const datosLetra = fuente
  .getPath(LETRA.caracter, LETRA.x - avance / 2, LETRA.y, LETRA.tamano)
  // getPath ya devuelve coordenadas SVG (y hacia abajo): sin flipY, que en opentype.js 2 es true
  // por defecto y voltearía la letra.
  .toPathData({ decimalPlaces: 3, flipY: false });
// opentype.js omite el cierre del último contorno; se añade para poder concatenar trazados.
const letra = /z$/i.test(datosLetra) ? datosLetra : `${datosLetra}Z`;

const logo = {
  fuente: 'Sora-ExtraBold (OFL), assets/marca/fuentes-origen',
  viewBox: '0 0 48 48',
  burbuja: BURBUJA,
  letra,
  colores: COLORES,
};

const salida = path.join(RAIZ, 'assets', 'marca');
console.log('Logo vectorial (assets/marca):');
escribirSiCambia(RUTA_LOGO_JSON, aJson(logo));
escribirSiCambia(path.join(salida, 'logo-oscuro.svg'), svgLogo(logo, 'oscuro'));
escribirSiCambia(path.join(salida, 'logo-claro.svg'), svgLogo(logo, 'claro'));
escribirSiCambia(
  path.join(salida, 'splash-logo.svg'),
  svgSplash(logo, 'oscuro'),
);
escribirSiCambia(
  path.join(salida, 'splash-logo-claro.svg'),
  svgSplash(logo, 'claro'),
);
console.log('Listo.');
