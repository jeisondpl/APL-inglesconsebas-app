// CA5 y CA11 (plan § 0.6): LogoMarca dibuja el isotipo oficial (la mano «OK» en el círculo con
// la «S») con los trazados de assets/marca/logo.json, extraídos del PDF vectorial del kit, y los
// colores de su categoría (corporate, self, kids; manual pp. 9–10). Con etiqueta es una imagen y
// sin ella queda oculto al lector. El logo es 100 % vectorial: ni logo.json ni los SVG generados
// contienen `<text`.
import { render, screen } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import type { ReactTestRendererJSON } from 'react-test-renderer';

import { LogoMarca, type CategoriaIsotipo } from '@/shared/components';
import {
  paleta,
  TemaProvider,
  temaClaro,
  temaOscuro,
  type ITema,
} from '@/shared/theme';

import logo from '../../../../assets/marca/logo.json';

const MARCA = path.join(__dirname, '..', '..', '..', '..', 'assets', 'marca');

/** react-native-svg codifica `fill` como ARGB entero sin signo. */
const argb = (hex: string) => 0xff000000 + parseInt(hex.slice(1), 16);

function nodosDeTipo(tipo: string): ReactTestRendererJSON[] {
  const encontrados: ReactTestRendererJSON[] = [];
  const recorrer = (nodo: unknown) => {
    if (Array.isArray(nodo)) {
      nodo.forEach(recorrer);
    } else if (nodo && typeof nodo === 'object') {
      const json = nodo as ReactTestRendererJSON;
      if (json.type === tipo) {
        encontrados.push(json);
      }
      (json.children ?? []).forEach(recorrer);
    }
  };
  recorrer(screen.toJSON());
  return encontrados;
}

const montar = (tema: ITema, props: Parameters<typeof LogoMarca>[0] = {}) =>
  render(
    <TemaProvider preferenciaInicial={tema.modo}>
      <LogoMarca {...props} />
    </TemaProvider>,
  );

// Manual, p. 10: círculo negro, gris o verde; contorno de la mano blanco; «S» gris en corporate y
// del color del círculo en self y kids (va sobre la «moneda» blanca, así que se ve).
const CATEGORIAS: [CategoriaIsotipo, string, string][] = [
  ['corporate', paleta.negro, paleta.gris],
  ['self', paleta.gris, paleta.gris],
  ['kids', paleta.verde, paleta.verde],
];

describe('LogoMarca: isotipo oficial (CA5, CA11)', () => {
  it.each(CATEGORIAS)(
    'la categoría %s pinta el círculo %s, el contorno blanco y la «S» %s',
    async (categoria, circulo, letra) => {
      await montar(temaOscuro, { categoria });
      const trazados = nodosDeTipo('RNSVGPath');
      expect(trazados.map(t => t.props.d)).toEqual([
        logo.isotipo.capas.circulo,
        logo.isotipo.capas.manoContorno,
        logo.isotipo.capas.manoRelleno,
        logo.isotipo.capas.letra,
      ]);
      expect(trazados.map(t => t.props.fill.payload)).toEqual(
        [circulo, paleta.blanco, circulo, letra].map(argb),
      );
    },
  );

  it('por defecto es corporate y no depende del tema', async () => {
    await montar(temaOscuro);
    const oscuro = nodosDeTipo('RNSVGPath').map(t => t.props.fill.payload);
    await montar(temaClaro);
    const claro = nodosDeTipo('RNSVGPath').map(t => t.props.fill.payload);
    expect(claro).toEqual(oscuro);
    expect(oscuro[0]).toBe(argb(paleta.negro));
  });

  it('por defecto mide 48 con el viewBox del isotipo; tamano lo cambia', async () => {
    await montar(temaOscuro, { testID: 'logo' });
    const svg = screen.getByTestId('logo', { includeHiddenElements: true });
    const [, , ancho, alto] = logo.isotipo.viewBox.split(' ').map(Number);
    expect(ancho).toBe(alto);
    expect(svg.props).toMatchObject({ width: 48, height: 48, vbWidth: ancho });

    await montar(temaOscuro, { testID: 'grande', tamano: 120 });
    expect(
      screen.getByTestId('grande', { includeHiddenElements: true }).props,
    ).toMatchObject({ width: 120, height: 120 });
  });

  it('con etiqueta se anuncia como imagen', async () => {
    await montar(temaClaro, { etiqueta: 'Isotipo de Inglés con Sebas' });
    expect(
      screen.getByRole('image', { name: 'Isotipo de Inglés con Sebas' }),
    ).toBeOnTheScreen();
  });

  it('sin etiqueta es decorativo: oculto a la accesibilidad', async () => {
    await montar(temaOscuro, { testID: 'logo' });
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.queryByTestId('logo')).toBeNull();
    const svg = screen.getByTestId('logo', { includeHiddenElements: true });
    expect(svg.props.accessible).toBe(false);
    expect(svg.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(svg.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('logo vectorial del kit (CA11)', () => {
  const svgs = fs.readdirSync(MARCA).filter(f => f.endsWith('.svg'));
  const leer = (archivo: string) =>
    fs.readFileSync(path.join(MARCA, archivo), 'utf8');

  it('se generan el logo principal claro y oscuro y los tres isotipos', () => {
    expect(svgs.sort()).toEqual([
      'isotipo-corporate.svg',
      'isotipo-kids.svg',
      'isotipo-self.svg',
      'logo-claro.svg',
      'logo-oscuro.svg',
    ]);
  });

  it('logo.json declara que sale del kit oficial, que está en el repo', () => {
    expect(logo.fuente).toMatch(/kit/i);
    for (const pdf of [
      'manual-de-marca.pdf',
      'ingles-con-sebas-negro.pdf',
      'logo-principal.pdf',
    ]) {
      expect(fs.existsSync(path.join(MARCA, 'kit', pdf))).toBe(true);
    }
  });

  it.each(['logo.json', ...svgs])('%s no contiene <text', archivo => {
    expect(leer(archivo)).not.toMatch(/<text/i);
  });

  it('todas las capas de logo.json son trazados SVG', () => {
    const capas = { ...logo.logo.capas, ...logo.isotipo.capas };
    expect(Object.keys(capas).sort()).toEqual([
      'circulo',
      'con',
      'letra',
      'manoContorno',
      'manoRelleno',
      'nombre',
    ]);
    for (const d of Object.values(capas)) {
      expect(d).toMatch(/^M-?\d/);
      expect(d).not.toMatch(/[<>]/);
    }
  });

  it.each(['oscuro', 'claro'] as const)(
    'logo-%s.svg dibuja las cuatro capas del logo principal con sus colores',
    variante => {
      const contenido = leer(`logo-${variante}.svg`);
      const c = logo.colores[variante];
      const { capas } = logo.logo;
      const pares: [string, string][] = [
        [capas.manoContorno, c.manoContorno],
        [capas.manoRelleno, c.manoRelleno],
        [capas.nombre, c.nombre],
        [capas.con, c.con],
      ];
      for (const [d, color] of pares) {
        expect(contenido).toContain(`d="${d}" fill="${color}"`);
      }
      expect(contenido).toContain(`viewBox="${logo.logo.viewBox}"`);
    },
  );

  it.each(CATEGORIAS)(
    'isotipo-%s.svg dibuja el círculo %s y la «S» %s',
    (categoria, circulo, letra) => {
      const contenido = leer(`isotipo-${categoria}.svg`);
      const { capas } = logo.isotipo;
      expect(contenido).toContain(`d="${capas.circulo}" fill="${circulo}"`);
      expect(contenido).toContain(`d="${capas.letra}" fill="${letra}"`);
      expect(contenido).toContain(
        `d="${capas.manoContorno}" fill="${paleta.blanco}"`,
      );
    },
  );

  it('los colores siguen el manual: claro sobre negro (p. 3) y gris sobre blanco (p. 4)', () => {
    expect(logo.colores.paleta).toEqual({
      blanco: '#FFFFFF',
      negro: '#000000',
      verde: '#86EF86',
      gris: '#A5AFA5',
    });
    expect(logo.colores.oscuro).toMatchObject({
      fondo: temaOscuro.colores.fondo,
      nombre: paleta.blanco,
      con: paleta.gris,
    });
    expect(logo.colores.claro).toMatchObject({
      fondo: temaClaro.colores.fondo,
      nombre: paleta.grisLogo,
      con: paleta.gris,
    });
  });
});
