// Genera los recursos del splash nativo en sus dos variantes a partir de assets/marca/logo.json,
// con el logo principal oficial (manual de marca, pp. 3 y 4):
//   oscuro: logo claro (blanco y gris) sobre negro #000000;
//   claro:  logo gris sobre blanco #FFFFFF.
//
// Sustituye al CLI `react-native-bootsplash generate`: su modo oscuro (--dark-*) exige una licencia
// de pago (decisión P2 del plan de F1-01b). La librería se usa solo en ejecución (BootTheme,
// RNBootSplash.init/initWithStoryboard y hide), y este script respeta los nombres que espera:
//
// Android (android/app/src/main/res):
//   drawable-<densidad>/bootsplash_logo.png        variante clara
//   drawable-night-<densidad>/bootsplash_logo.png  variante oscura
//   values/colors.xml        bootsplash_background = #FFFFFF
//   values-night/colors.xml  bootsplash_background = #000000
//   Como hace el CLI, el PNG es un lienzo de 288 dp (tamaño del ícono del splash de Android 12+)
//   con el logo de 160 dp de ancho centrado: sus esquinas quedan a unos 90 dp del centro, dentro
//   del círculo de 192 dp de la máscara de Android 12+.
// iOS (ios/InglesConSebas):
//   Colors.xcassets/BootSplashBackground.colorset   apariencias Any (blanco) y Dark (negro)
//   Images.xcassets/BootSplashLogo.imageset         160 pt de ancho, @1x a @3x, Any y Dark
//   BootSplash.storyboard                           logo centrado sobre BootSplashBackground
//
// Android e iOS eligen la variante según el modo del sistema, sin código.
// Uso: npm run marca:splash   (idempotente: si nada cambia, no escribe)
import path from 'node:path';
import sharp from 'sharp';

import {
  RAIZ,
  aJson,
  escribirSiCambia,
  altoLogo,
  grupoLogo,
  leerLogo,
  svg,
} from './marca-svg.mjs';

const ANCHO_LOGO = 160; // dp / pt
const LIENZO_ANDROID = 288; // dp, como el CLI de bootsplash

const DENSIDADES = [
  { sufijo: 'mdpi', escala: 1 },
  { sufijo: 'hdpi', escala: 1.5 },
  { sufijo: 'xhdpi', escala: 2 },
  { sufijo: 'xxhdpi', escala: 3 },
  { sufijo: 'xxxhdpi', escala: 4 },
];

const logo = leerLogo();
const res = path.join(RAIZ, 'android', 'app', 'src', 'main', 'res');
const ios = path.join(RAIZ, 'ios', 'InglesConSebas');
const ALTO_LOGO = Math.round(altoLogo(logo, ANCHO_LOGO));

/** SVG del logo principal de la variante a `escala` (ANCHO_LOGO × ALTO_LOGO por la escala). */
const svgSplash = (variante, escala) =>
  svg(
    ANCHO_LOGO * escala,
    ALTO_LOGO * escala,
    grupoLogo(logo, variante, {
      ancho: ANCHO_LOGO * escala,
      y: ((ALTO_LOGO - altoLogo(logo, ANCHO_LOGO)) * escala) / 2,
    }),
  );

/** PNG del logo del splash a `escala`, opcionalmente centrado en un lienzo transparente. */
async function pngSplash(variante, escala, lienzo) {
  const logoPng = await sharp(Buffer.from(svgSplash(variante, escala)))
    .png()
    .toBuffer();
  if (!lienzo) {
    return sharp(logoPng).png({ compressionLevel: 9 }).toBuffer();
  }
  const lado = Math.round(lienzo * escala);
  const izquierda = Math.round((lado - ANCHO_LOGO * escala) / 2);
  const arriba = Math.round((lado - ALTO_LOGO * escala) / 2);
  return sharp({
    create: {
      width: lado,
      height: lado,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logoPng, left: izquierda, top: arriba }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const coloresXml = color =>
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<!-- Generado por scripts/generar-splash.mjs (npm run marca:splash). No editar a mano. -->\n' +
  '<resources>\n' +
  `    <color name="bootsplash_background">${color}</color>\n` +
  '</resources>\n';

/** Componentes sRGB (0–1) de un color hexadecimal para los Contents.json de Xcode. */
function componentes(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const f = c => (c / 255).toFixed(3);
  return { red: f(r), green: f(g), blue: f(b), alpha: '1.000' };
}

const OSCURO = [{ appearance: 'luminosity', value: 'dark' }];
const infoXcode = { author: 'xcode', version: 1 };

function storyboard() {
  const ancho = 375;
  const alto = 667;
  const x = (ancho - ANCHO_LOGO) / 2;
  const y = (alto - ALTO_LOGO) / 2;
  // Valor de diseño del storyboard; en ejecución manda el color del asset catalog (Any/Dark).
  const fondo = componentes(logo.colores.claro.fondo);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/generar-splash.mjs (npm run marca:splash). No editar a mano. -->
<document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="21701" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" launchScreen="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="01J-lp-oVM">
    <device id="retina4_7" orientation="portrait" appearance="light"/>
    <dependencies>
        <deployment identifier="iOS"/>
        <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="21678"/>
        <capability name="Named colors" minToolsVersion="9.0"/>
        <capability name="Safe area layout guides" minToolsVersion="9.0"/>
        <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
    </dependencies>
    <scenes>
        <!--View Controller-->
        <scene sceneID="EHf-IW-A2E">
            <objects>
                <viewController modalTransitionStyle="crossDissolve" id="01J-lp-oVM" sceneMemberID="viewController">
                    <view key="view" autoresizesSubviews="NO" contentMode="scaleToFill" id="Ze5-6b-2t3">
                        <rect key="frame" x="0.0" y="0.0" width="${ancho}" height="${alto}"/>
                        <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                        <subviews>
                            <imageView autoresizesSubviews="NO" clipsSubviews="YES" userInteractionEnabled="NO" contentMode="scaleAspectFit" image="BootSplashLogo" translatesAutoresizingMaskIntoConstraints="NO" id="3lX-Ut-9ad">
                                <rect key="frame" x="${x}" y="${y}" width="${ANCHO_LOGO}" height="${ALTO_LOGO}"/>
                                <accessibility key="accessibilityConfiguration">
                                    <accessibilityTraits key="traits" image="YES" notEnabled="YES"/>
                                </accessibility>
                            </imageView>
                        </subviews>
                        <viewLayoutGuide key="safeArea" id="Bcu-3y-fUS"/>
                        <color key="backgroundColor" name="BootSplashBackground"/>
                        <constraints>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerX" secondItem="Ze5-6b-2t3" secondAttribute="centerX" id="Fh9-Fy-1nT"/>
                            <constraint firstItem="3lX-Ut-9ad" firstAttribute="centerY" secondItem="Ze5-6b-2t3" secondAttribute="centerY" id="nvB-Ic-PnI"/>
                        </constraints>
                    </view>
                </viewController>
                <placeholder placeholderIdentifier="IBFirstResponder" id="iYj-Kq-Ea1" userLabel="First Responder" sceneMemberID="firstResponder"/>
            </objects>
            <point key="canvasLocation" x="0.0" y="0.0"/>
        </scene>
    </scenes>
    <resources>
        <image name="BootSplashLogo" width="${ANCHO_LOGO}" height="${ALTO_LOGO}"/>
        <namedColor name="BootSplashBackground">
            <color red="${fondo.red}" green="${fondo.green}" blue="${fondo.blue}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>
        </namedColor>
    </resources>
</document>
`;
}

console.log('Splash nativo (claro y oscuro):');

// Android
for (const { sufijo, escala } of DENSIDADES) {
  escribirSiCambia(
    path.join(res, `drawable-${sufijo}`, 'bootsplash_logo.png'),
    await pngSplash('claro', escala, LIENZO_ANDROID),
  );
  escribirSiCambia(
    path.join(res, `drawable-night-${sufijo}`, 'bootsplash_logo.png'),
    await pngSplash('oscuro', escala, LIENZO_ANDROID),
  );
}
escribirSiCambia(
  path.join(res, 'values', 'colors.xml'),
  coloresXml(logo.colores.claro.fondo),
);
escribirSiCambia(
  path.join(res, 'values-night', 'colors.xml'),
  coloresXml(logo.colores.oscuro.fondo),
);

// iOS: color de fondo con apariencias
const colores = path.join(ios, 'Colors.xcassets');
escribirSiCambia(
  path.join(colores, 'Contents.json'),
  aJson({ info: infoXcode }),
);
escribirSiCambia(
  path.join(colores, 'BootSplashBackground.colorset', 'Contents.json'),
  aJson({
    colors: [
      {
        idiom: 'universal',
        color: {
          'color-space': 'srgb',
          components: componentes(logo.colores.claro.fondo),
        },
      },
      {
        idiom: 'universal',
        appearances: OSCURO,
        color: {
          'color-space': 'srgb',
          components: componentes(logo.colores.oscuro.fondo),
        },
      },
    ],
    info: infoXcode,
  }),
);

// iOS: logo con apariencias
const imageset = path.join(ios, 'Images.xcassets', 'BootSplashLogo.imageset');
const imagenes = [];
for (const escala of [1, 2, 3]) {
  const sufijo = escala === 1 ? '' : `@${escala}x`;
  for (const variante of ['claro', 'oscuro']) {
    const archivo = `logo-${variante}${sufijo}.png`;
    escribirSiCambia(
      path.join(imageset, archivo),
      await pngSplash(variante, escala),
    );
    imagenes.push({
      idiom: 'universal',
      ...(variante === 'oscuro' ? { appearances: OSCURO } : {}),
      filename: archivo,
      scale: `${escala}x`,
    });
  }
}
escribirSiCambia(
  path.join(imageset, 'Contents.json'),
  aJson({ images: imagenes, info: infoXcode }),
);
escribirSiCambia(path.join(ios, 'BootSplash.storyboard'), storyboard());

console.log('Listo.');
