// Genera el ícono de la app con el isotipo oficial (la mano «OK» en el círculo con la «S»,
// categoría Corporate: círculo negro, mano blanca y «S» gris; manual de marca, pp. 9 y 10), a
// partir de assets/marca/logo.json.
//
// Android (android/app/src/main/res):
//   mipmap-<densidad>/ic_launcher.png y ic_launcher_round.png   legacy (API 24–25), 48–192 px
//   mipmap-<densidad>/ic_launcher_foreground.png                 adaptativo, 108 dp (108–432 px)
//   mipmap-<densidad>/ic_launcher_monochrome.png                 íconos temáticos (Android 13+)
//   mipmap-anydpi-v26/ic_launcher.xml e ic_launcher_round.xml    background + foreground + monochrome
//   values/ic_launcher_background.xml                            #000000 (el círculo del isotipo)
//   En el adaptativo, la mano se escala para que todos sus puntos queden a menos de 32 dp del
//   centro: dentro de la zona segura (círculo de 66 dp) con cualquier máscara.
// iOS (ios/InglesConSebas/Images.xcassets/AppIcon.appiconset): los 9 PNG del Contents.json,
//   opacos. El script falla si alguno conserva canal alfa (el App Store rechaza el de 1024).
// Play: assets/marca/icono-play-512.png.
//
// Uso: npm run marca:iconos   (idempotente: si nada cambia, no escribe)
import path from 'node:path';
import sharp from 'sharp';

import {
  RAIZ,
  aJson,
  escribirSiCambia,
  grupoIsotipo,
  leerLogo,
  medidas,
  svg,
} from './marca-svg.mjs';

const logo = leerLogo();
const FONDO = logo.colores.isotipo.corporate.circulo;
const res = path.join(RAIZ, 'android', 'app', 'src', 'main', 'res');
const appIcon = path.join(
  RAIZ,
  'ios',
  'InglesConSebas',
  'Images.xcassets',
  'AppIcon.appiconset',
);

/** Fracción del lado que ocupa el isotipo en los íconos cuadrados (legacy, iOS y Play). */
const PROPORCION_CUADRADO = 0.8;
const LIENZO_ADAPTATIVO = 108; // dp
const RADIO_SEGURO = 32; // dp, con margen dentro de la zona segura de 66 dp

const DENSIDADES = [
  { sufijo: 'mdpi', escala: 1 },
  { sufijo: 'hdpi', escala: 1.5 },
  { sufijo: 'xhdpi', escala: 2 },
  { sufijo: 'xxhdpi', escala: 3 },
  { sufijo: 'xxxhdpi', escala: 4 },
];

/**
 * Lado del isotipo (en dp) para que la mano y la «S» queden dentro de RADIO_SEGURO alrededor del
 * centro del círculo. Se mide sobre todos los puntos de sus trazados (incluidos los de control de
 * las curvas, que acotan la curva por fuera).
 */
function ladoAdaptativo() {
  const { ancho } = medidas(logo.isotipo.viewBox);
  const centro = ancho / 2;
  const { manoContorno, letra } = logo.isotipo.capas;
  const numeros = `${manoContorno} ${letra}`
    .replace(/[A-Za-z]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(Number);
  let radio = 0;
  for (let i = 0; i + 1 < numeros.length; i += 2) {
    radio = Math.max(
      radio,
      Math.hypot(numeros[i] - centro, numeros[i + 1] - centro),
    );
  }
  return (RADIO_SEGURO / radio) * ancho;
}
const LADO_ADAPTATIVO = ladoAdaptativo();

const png = async (svgTexto, opaco = false) => {
  let imagen = sharp(Buffer.from(svgTexto));
  if (opaco) {
    imagen = imagen.flatten({ background: FONDO }).removeAlpha();
  }
  return imagen.png({ compressionLevel: 9 }).toBuffer();
};

/** Isotipo centrado en un lado `lado`, con un lado propio de `ladoIsotipo`. */
const isotipoCentrado = (lado, ladoIsotipo, opciones = {}) =>
  grupoIsotipo(logo, {
    x: (lado - ladoIsotipo) / 2,
    y: (lado - ladoIsotipo) / 2,
    lado: ladoIsotipo,
    ...opciones,
  });

/** Ícono: 'cuadrado' (iOS y Play, sin redondeo), 'redondeado' (legacy) o 'circulo' (redondo). */
function svgIcono(lado, forma) {
  if (forma === 'circulo') {
    return svg(lado, lado, isotipoCentrado(lado, lado));
  }
  const rx = forma === 'redondeado' ? lado * 0.18 : 0;
  return svg(
    lado,
    lado,
    `<rect width="${lado}" height="${lado}" rx="${rx}" fill="${FONDO}"/>` +
      isotipoCentrado(lado, lado * PROPORCION_CUADRADO),
  );
}

function svgAdaptativo(escala, monocromo) {
  const lado = LIENZO_ADAPTATIVO * escala;
  return svg(
    lado,
    lado,
    isotipoCentrado(lado, LADO_ADAPTATIVO * escala, {
      sinCirculo: true,
      monocromo,
    }),
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
    await png(svgAdaptativo(escala, false)),
  );
  escribirSiCambia(
    path.join(dir, 'ic_launcher_monochrome.png'),
    await png(svgAdaptativo(escala, true)),
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
