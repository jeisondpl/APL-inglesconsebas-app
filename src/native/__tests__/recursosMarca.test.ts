// CA9 y CA10 (plan § 0.3 y § 0.6): recursos nativos que generan generar-splash.mjs y
// generar-iconos.mjs a partir del kit oficial. Splash claro (logo gris sobre blanco) y oscuro
// (logo claro sobre negro) sin recorte por la máscara de Android 12+; ícono adaptativo, monocromo y
// legacy con el isotipo, AppIcon de iOS con 9 PNG y el de 1024 sin canal alfa.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const RAIZ = path.join(__dirname, '..', '..', '..');
const RES = path.join(RAIZ, 'android', 'app', 'src', 'main', 'res');
const IOS = path.join(RAIZ, 'ios', 'InglesConSebas');
const DENSIDADES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'] as const;
const ESCALA = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const leer = (...partes: string[]) =>
  fs.readFileSync(path.join(...partes), 'utf8');

/** Mayor distancia al centro de un píxel visible (alfa > 8), como fracción del ancho. */
async function radioVisible(archivo: string) {
  const { data, info } = await sharp(archivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let maximo = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 8) {
        const d = Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2);
        maximo = Math.max(maximo, d);
      }
    }
  }
  return { radio: maximo / width, ancho: width, alto: height };
}

/** Color medio de los píxeles visibles. */
async function colorDominante(archivo: string) {
  const { data, info } = await sharp(archivo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] > 200) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  return [r / n, g / n, b / n].map(Math.round);
}

describe('splash nativo de Android (CA9)', () => {
  it('el fondo es blanco en modo claro y negro en modo oscuro', () => {
    expect(leer(RES, 'values', 'colors.xml')).toMatch(
      /<color name="bootsplash_background">#FFFFFF<\/color>/,
    );
    expect(leer(RES, 'values-night', 'colors.xml')).toMatch(
      /<color name="bootsplash_background">#000000<\/color>/,
    );
  });

  it('BootTheme usa los recursos que espera react-native-bootsplash', () => {
    const estilos = leer(RES, 'values', 'styles.xml');
    expect(estilos).toMatch(
      /<style name="BootTheme" parent="Theme.BootSplash">/,
    );
    expect(estilos).toContain('@color/bootsplash_background');
    expect(estilos).toContain('@drawable/bootsplash_logo');
    expect(estilos).toContain('@style/AppTheme');
    expect(
      leer(RAIZ, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    ).toContain('@style/BootTheme');
  });

  it.each(DENSIDADES)(
    'en %s hay logo claro y oscuro de 288 dp, dentro del círculo de 192 dp de Android 12+',
    async densidad => {
      for (const carpeta of [
        `drawable-${densidad}`,
        `drawable-night-${densidad}`,
      ]) {
        const archivo = path.join(RES, carpeta, 'bootsplash_logo.png');
        const { radio, ancho, alto } = await radioVisible(archivo);
        expect(ancho).toBe(288 * ESCALA[densidad]);
        expect(alto).toBe(ancho);
        // Círculo de 192 dp sobre un lienzo de 288 dp: radio = 96/288 del ancho.
        expect(radio).toBeLessThanOrEqual(96 / 288);
      }
    },
  );

  it('el logo claro es gris (sobre blanco) y el oscuro es claro (sobre negro)', async () => {
    const claro = await colorDominante(
      path.join(RES, 'drawable-xxhdpi', 'bootsplash_logo.png'),
    );
    const oscuro = await colorDominante(
      path.join(RES, 'drawable-night-xxhdpi', 'bootsplash_logo.png'),
    );
    // Gris: canales parecidos y luminosidad media; claro: casi blanco.
    expect(Math.max(...claro) - Math.min(...claro)).toBeLessThan(20);
    expect(Math.max(...claro)).toBeLessThan(180);
    expect(Math.min(...oscuro)).toBeGreaterThan(200);
  });
});

describe('splash nativo de iOS (CA9)', () => {
  it('BootSplashBackground es blanco en Any y negro en Dark', () => {
    const { colors } = JSON.parse(
      leer(
        IOS,
        'Colors.xcassets',
        'BootSplashBackground.colorset',
        'Contents.json',
      ),
    );
    const componentes = (c: {
      color: { components: Record<string, string> };
    }) => ['red', 'green', 'blue'].map(k => Number(c.color.components[k]));
    const cualquiera = colors.find(
      (c: { appearances?: unknown }) => !c.appearances,
    );
    const oscuro = colors.find((c: { appearances?: { value: string }[] }) =>
      c.appearances?.some(a => a.value === 'dark'),
    );
    expect(componentes(cualquiera)).toEqual([1, 1, 1]);
    expect(componentes(oscuro)).toEqual([0, 0, 0]);
  });

  it('BootSplashLogo tiene variante clara y oscura en 1x, 2x y 3x, y el storyboard la usa', () => {
    const conjunto = path.join(
      IOS,
      'Images.xcassets',
      'BootSplashLogo.imageset',
    );
    const { images } = JSON.parse(leer(conjunto, 'Contents.json'));
    expect(images).toHaveLength(6);
    for (const imagen of images) {
      expect(fs.existsSync(path.join(conjunto, imagen.filename))).toBe(true);
    }
    const storyboard = leer(IOS, 'BootSplash.storyboard');
    expect(storyboard).toContain('BootSplashLogo');
    expect(storyboard).toContain('BootSplashBackground');
    expect(leer(IOS, 'Info.plist')).toMatch(
      /<key>UILaunchStoryboardName<\/key>\s*<string>BootSplash<\/string>/,
    );
  });
});

describe('ícono de Android (CA10)', () => {
  it.each(['ic_launcher.xml', 'ic_launcher_round.xml'])(
    '%s es adaptativo con fondo, primer plano y monocromo',
    archivo => {
      const xml = leer(RES, 'mipmap-anydpi-v26', archivo);
      expect(xml).toContain('<adaptive-icon');
      expect(xml).toContain('@color/ic_launcher_background');
      expect(xml).toContain('@mipmap/ic_launcher_foreground');
      expect(xml).toContain('@mipmap/ic_launcher_monochrome');
    },
  );

  it('el fondo del adaptativo es el negro del isotipo corporate', () => {
    expect(leer(RES, 'values', 'ic_launcher_background.xml')).toMatch(
      /<color name="ic_launcher_background">#000000<\/color>/,
    );
  });

  it.each(DENSIDADES)(
    'en %s el legacy mide 48 dp y el primer plano y el monocromo, 108 dp dentro de la zona segura de 66 dp',
    async densidad => {
      const carpeta = path.join(RES, `mipmap-${densidad}`);
      for (const legacy of ['ic_launcher.png', 'ic_launcher_round.png']) {
        const meta = await sharp(path.join(carpeta, legacy)).metadata();
        expect(meta.width).toBe(48 * ESCALA[densidad]);
      }
      for (const capa of [
        'ic_launcher_foreground.png',
        'ic_launcher_monochrome.png',
      ]) {
        const { radio, ancho } = await radioVisible(path.join(carpeta, capa));
        expect(ancho).toBe(108 * ESCALA[densidad]);
        expect(radio).toBeLessThanOrEqual(33 / 108);
      }
    },
  );

  it('el monocromo es una silueta blanca', async () => {
    const color = await colorDominante(
      path.join(RES, 'mipmap-xxxhdpi', 'ic_launcher_monochrome.png'),
    );
    expect(Math.min(...color)).toBeGreaterThan(240);
  });
});

describe('AppIcon de iOS e ícono de Play (CA10)', () => {
  const conjunto = path.join(IOS, 'Images.xcassets', 'AppIcon.appiconset');

  it('Contents.json declara las 9 casillas de iPhone y marketing, con PNG que existen y miden lo declarado', async () => {
    const { images } = JSON.parse(leer(conjunto, 'Contents.json'));
    const archivos = images.map((i: { filename: string }) => i.filename);
    expect(images).toHaveLength(9);
    // 40@3x y 60@2x miden 120 px y comparten archivo: 8 PNG distintos.
    expect(new Set(archivos).size).toBe(8);
    for (const imagen of images) {
      const lado = Number(imagen.size.split('x')[0]) * Number(imagen.scale[0]);
      const meta = await sharp(path.join(conjunto, imagen.filename)).metadata();
      expect(meta.width).toBe(lado);
      expect(meta.height).toBe(lado);
    }
  });

  it('el de 1024 px no tiene canal alfa', async () => {
    const meta = await sharp(path.join(conjunto, 'icono-1024.png')).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.hasAlpha).toBe(false);
  });

  it('el ícono de Play mide 512 px y no tiene alfa', async () => {
    const meta = await sharp(
      path.join(RAIZ, 'assets', 'marca', 'icono-play-512.png'),
    ).metadata();
    expect(meta).toMatchObject({ width: 512, height: 512, hasAlpha: false });
  });
});
