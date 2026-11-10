// Genera el ícono de la app a partir de assets/marca/logo.json (burbuja verde con la «S» sobre
// Noche #05070B, variante oscura de la lámina).
//
// Android (android/app/src/main/res):
//   mipmap-<densidad>/ic_launcher.png y ic_launcher_round.png   legacy (API 24–25), 48–192 px
//   mipmap-<densidad>/ic_launcher_foreground.png                 adaptativo, 108 dp (108–432 px)
//   mipmap-<densidad>/ic_launcher_monochrome.png                 íconos temáticos (Android 13+)
//   mipmap-anydpi-v26/ic_launcher.xml e ic_launcher_round.xml    background + foreground + monochrome
//   values/ic_launcher_background.xml                            #05070B
//   El logo del adaptativo mide 58 dp dentro del lienzo de 108 dp: cabe en la zona segura
//   (círculo de 66 dp) con cualquier máscara.
// iOS (ios/InglesConSebas/Images.xcassets/AppIcon.appiconset): los 9 PNG del Contents.json,
//   opacos. El de 1024 px se aplana con removeAlpha y el script falla si conserva canal alfa.
// Play: assets/marca/icono-play-512.png.
//
// Uso: npm run marca:iconos   (idempotente: si nada cambia, no escribe)
import path from 'node:path';
import sharp from 'sharp';

import {
  RAIZ,
  aJson,
  escribirSiCambia,
  grupoLogo,
  leerLogo,
  svg,
} from './marca-svg.mjs';

const logo = leerLogo();
const FONDO = logo.colores.fondoIcono;
const COLORES_LOGO = {
  burbuja: logo.colores.oscuro.burbuja,
  letra: logo.colores.oscuro.letra,
};
const res = path.join(RAIZ, 'android', 'app', 'src', 'main', 'res');
const appIcon = path.join(
  RAIZ,
  'ios',
  'InglesConSebas',
  'Images.xcassets',
  'AppIcon.appiconset',
);

/** Fracción del lado que ocupa la caja de 48 del logo en los íconos legacy, de iOS y de Play. */
const PROPORCION_LOGO = 0.56;
/** Adaptativo: lienzo de 108 dp con el logo en una caja de 58 dp centrada. */
const LIENZO_ADAPTATIVO = 108;
const LOGO_ADAPTATIVO = 58;

const DENSIDADES = [
  { sufijo: 'mdpi', escala: 1 },
  { sufijo: 'hdpi', escala: 1.5 },
  { sufijo: 'xhdpi', escala: 2 },
  { sufijo: 'xxhdpi', escala: 3 },
  { sufijo: 'xxxhdpi', escala: 4 },
];

const png = async (svgTexto, opaco = false) => {
  let imagen = sharp(Buffer.from(svgTexto));
  if (opaco) {
    imagen = imagen.flatten({ background: FONDO }).removeAlpha();
  }
  return imagen.png({ compressionLevel: 9 }).toBuffer();
};

/** Logo centrado en un lado `lado`, ocupando `proporcion` del lado. */
function logoCentrado(lado, proporcion, colores = COLORES_LOGO) {
  const tamano = lado * proporcion;
  const inicio = (lado - tamano) / 2;
  return grupoLogo(logo, { x: inicio, y: inicio, tamano, colores });
}

/** Ícono cuadrado: `forma` = 'cuadrado' (sin redondeo), 'redondeado' o 'circulo'. */
function svgIcono(lado, forma) {
  let fondo;
  if (forma === 'circulo') {
    fondo = `<circle cx="${lado / 2}" cy="${lado / 2}" r="${
      lado / 2
    }" fill="${FONDO}"/>`;
  } else {
    const rx = forma === 'redondeado' ? lado * 0.18 : 0;
    fondo = `<rect width="${lado}" height="${lado}" rx="${rx}" fill="${FONDO}"/>`;
  }
  return svg(lado, lado, fondo + logoCentrado(lado, PROPORCION_LOGO));
}

function svgAdaptativo(lado, monocromo) {
  const colores = monocromo
    ? { burbuja: '#FFFFFF', letra: null } // silueta blanca con la «S» calada (evenodd)
    : COLORES_LOGO;
  return svg(
    lado,
    lado,
    logoCentrado(lado, LOGO_ADAPTATIVO / LIENZO_ADAPTATIVO, colores),
  );
}

const xmlAdaptativo =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<!-- Generado por scripts/generar-iconos.mjs (npm run marca:iconos). No editar a mano. -->\n' +
  '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n' +
  '    <background android:drawable="@color/ic_launcher_background" />\n' +
  '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n' +
  '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />\n' +
  '</adaptive-icon>\n';

console.log('Íconos (Android, iOS y Play):');

// Android legacy y capas del adaptativo
for (const { sufijo, escala } of DENSIDADES) {
  const dir = path.join(res, `mipmap-${sufijo}`);
  const lado = Math.round(48 * escala);
  const ladoAdaptativo = Math.round(LIENZO_ADAPTATIVO * escala);
  escribirSiCambia(
    path.join(dir, 'ic_launcher.png'),
    await png(svgIcono(lado, 'redondeado')),
  );
  escribirSiCambia(
    path.join(dir, 'ic_launcher_round.png'),
    await png(svgIcono(lado, 'circulo')),
  );
  escribirSiCambia(
    path.join(dir, 'ic_launcher_foreground.png'),
    await png(svgAdaptativo(ladoAdaptativo, false)),
  );
  escribirSiCambia(
    path.join(dir, 'ic_launcher_monochrome.png'),
    await png(svgAdaptativo(ladoAdaptativo, true)),
  );
}
for (const nombre of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  escribirSiCambia(path.join(res, 'mipmap-anydpi-v26', nombre), xmlAdaptativo);
}
escribirSiCambia(
  path.join(res, 'values', 'ic_launcher_background.xml'),
  '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generado por scripts/generar-iconos.mjs (npm run marca:iconos). No editar a mano. -->\n' +
    '<resources>\n' +
    `    <color name="ic_launcher_background">${FONDO}</color>\n` +
    '</resources>\n',
);

// iOS: AppIcon (todas opacas; el App Store rechaza el de 1024 con canal alfa)
const ICONOS_IOS = [
  { idiom: 'iphone', size: 20, scale: 2 },
  { idiom: 'iphone', size: 20, scale: 3 },
  { idiom: 'iphone', size: 29, scale: 2 },
  { idiom: 'iphone', size: 29, scale: 3 },
  { idiom: 'iphone', size: 40, scale: 2 },
  { idiom: 'iphone', size: 40, scale: 3 },
  { idiom: 'iphone', size: 60, scale: 2 },
  { idiom: 'iphone', size: 60, scale: 3 },
  { idiom: 'ios-marketing', size: 1024, scale: 1 },
];
const imagenes = [];
for (const { idiom, size, scale } of ICONOS_IOS) {
  const lado = size * scale;
  const archivo = `icono-${lado}.png`;
  const datos = await png(svgIcono(lado, 'cuadrado'), true);
  const { hasAlpha, width } = await sharp(datos).metadata();
  if (hasAlpha || width !== lado) {
    throw new Error(
      `El ícono de iOS ${archivo} debe ser opaco y medir ${lado} px (alfa: ${hasAlpha}, ancho: ${width}).`,
    );
  }
  escribirSiCambia(path.join(appIcon, archivo), datos);
  imagenes.push({
    filename: archivo,
    idiom,
    scale: `${scale}x`,
    size: `${size}x${size}`,
  });
}
escribirSiCambia(
  path.join(appIcon, 'Contents.json'),
  aJson({ images: imagenes, info: { author: 'xcode', version: 1 } }),
);

// Play Store
escribirSiCambia(
  path.join(RAIZ, 'assets', 'marca', 'icono-play-512.png'),
  await png(svgIcono(512, 'cuadrado'), true),
);

console.log('Listo.');
