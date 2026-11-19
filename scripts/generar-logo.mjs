// Genera las vistas SVG del logo oficial a partir de assets/marca/logo.json, que extrae
// scripts/extraer-logo-kit.py de los PDF vectoriales del kit (assets/marca/kit). Sirven de
// referencia y para comparar con el manual; la app dibuja el logo desde logo.json (LogoMarca y
// Marca). Ningún SVG lleva <text>: el script falla si logo.json contiene texto.
//
// Uso: npm run marca:logo   (idempotente: si nada cambia, no escribe)
import path from 'node:path';

import {
  RAIZ,
  escribirSiCambia,
  leerLogo,
  svgIsotipo,
  svgLogo,
} from './marca-svg.mjs';

const logo = leerLogo();
if (JSON.stringify(logo).includes('<text')) {
  throw new Error('assets/marca/logo.json no puede contener <text>.');
}

const salida = path.join(RAIZ, 'assets', 'marca');
console.log('Logo oficial (assets/marca):');
escribirSiCambia(path.join(salida, 'logo-oscuro.svg'), svgLogo(logo, 'oscuro'));
escribirSiCambia(path.join(salida, 'logo-claro.svg'), svgLogo(logo, 'claro'));
for (const categoria of Object.keys(logo.colores.isotipo)) {
  escribirSiCambia(
    path.join(salida, `isotipo-${categoria}.svg`),
    svgIsotipo(logo, categoria),
  );
}
console.log('Listo.');
