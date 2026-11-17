// Tester (F1-04): lo transversal del rediseño animado.
// - CA4: el kit solo importa de `shared` (más react, reanimated, svg y el logo generado).
// - CA14 y la marca (§ 2.2, § 2.4): ningún hex, `rgba(`, color con nombre ni `fontWeight` en lo que
//   toca F1-04, y `fill`/`stroke` literales solo «none» o un gradiente `url(#…)`.
// - Token `halo`: el verde oficial en los dos temas y contraste AA del texto sobre el halo, con las
//   opacidades leídas de FondoMarca.tsx (si cambian, el test las sigue).
// - CA5 de punta a punta: con reduce-motion, el onboarding y el login no lanzan ni bucles ni
//   resortes (solo fundidos).
import { NavigationContainer } from '@react-navigation/native';
import { render, screen } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependenciasProvider } from '@/app/di';
import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { OnboardingScreen } from '@/modules/onboarding/presentation/screens/OnboardingScreen';
import { LoginScreen } from '@/modules/sesion/presentation/screens/LoginScreen';
import {
  paleta,
  relacionContraste,
  TemaProvider,
  temaClaro,
  temaOscuro,
  type ModoTema,
} from '@/shared/theme';

const SRC = path.resolve(__dirname, '../../..');

/** Lo que crea o rediseña F1-04 (más los dos componentes compartidos que anima). */
const RUTAS_F104 = [
  'shared/movimiento',
  'app/splash',
  'modules/onboarding/presentation',
  'modules/sesion/presentation',
  'shared/components/Boton.tsx',
  'shared/components/Campo.tsx',
].map(r => path.join(SRC, r));

function archivos(ruta: string): string[] {
  if (fs.statSync(ruta).isFile()) {
    return [ruta];
  }
  return fs.readdirSync(ruta, { withFileTypes: true }).flatMap(e => {
    const hijo = path.join(ruta, e.name);
    if (e.isDirectory()) {
      return e.name === '__tests__' ? [] : archivos(hijo);
    }
    return /\.(ts|tsx)$/.test(e.name) ? [hijo] : [];
  });
}

const TODOS = RUTAS_F104.flatMap(archivos);
const leer = (r: string) => fs.readFileSync(r, 'utf8');

function lineasCon(patron: RegExp, rutas = TODOS): string[] {
  return rutas.flatMap(r =>
    leer(r)
      .split('\n')
      .map((linea, i) => ({ linea, i }))
      // Los comentarios pueden citar valores de marca (#86EF86) como documentación.
      .filter(({ linea }) => !/^\s*(\/\/|\*|\/\*)/.test(linea))
      .filter(({ linea }) => patron.test(linea))
      .map(
        ({ linea, i }) => `${path.relative(SRC, r)}:${i + 1}: ${linea.trim()}`,
      ),
  );
}

describe('F1-04: marca en el código (CA14, marca § 2.2 y § 2.4)', () => {
  it('cubre los archivos del rediseño', () => {
    const nombres = TODOS.map(r => path.basename(r));
    expect(nombres).toEqual(
      expect.arrayContaining([
        'FondoMarca.tsx',
        'PulsoCarga.tsx',
        'Revelar.tsx',
        'SplashAnimado.tsx',
        'RaizConSplash.tsx',
        'LoginScreen.tsx',
        'PuntosPin.tsx',
        'TecladoPin.tsx',
        'OnboardingScreen.tsx',
        'PaginaOnboarding.tsx',
        'IndicadorPaginas.tsx',
      ]),
    );
  });

  it('no hay colores hexadecimales', () => {
    expect(lineasCon(/#[0-9a-f]{3}([0-9a-f]{3})?\b/i)).toEqual([]);
  });

  it('no hay rgb()/rgba()/hsl() ni colores con nombre', () => {
    expect(lineasCon(/\b(rgba?|hsla?)\s*\(/i)).toEqual([]);
    expect(
      lineasCon(
        /['"](white|black|red|green|blue|gray|grey|yellow|orange|lime)['"]/i,
      ),
    ).toEqual([]);
  });

  it('no hay fontWeight (las fuentes de marca van por archivo)', () => {
    expect(lineasCon(/fontWeight/)).toEqual([]);
  });

  it('fill y stroke literales solo son «none» o un gradiente url(#…)', () => {
    const malos = lineasCon(/\b(fill|stroke)=["']/).filter(
      l => !/\b(fill|stroke)=["'](none|url\(#\w+\))["']/.test(l),
    );
    expect(malos).toEqual([]);
  });
});

describe('kit de movimiento: solo depende de shared (CA4)', () => {
  const kit = archivos(path.join(SRC, 'shared/movimiento'));
  const permitidos = [
    /^react$/,
    /^react-native$/,
    /^react-native-reanimated$/,
    /^react-native-svg$/,
    /^@\/shared\//,
    /^\.\/[\w.]+$/,
    /^\.\.\/\.\.\/\.\.\/assets\/marca\/logo\.json$/,
  ];

  it.each(kit.map(r => [path.basename(r), r]))('%s', (_, ruta) => {
    const origenes = [...leer(ruta).matchAll(/from\s+'([^']+)'/g)].map(
      m => m[1],
    );
    // movimiento.tokens.ts no importa nada: también vale.
    for (const o of origenes) {
      expect(permitidos.some(p => p.test(o)) ? o : `prohibido: ${o}`).toBe(o);
    }
  });
});

/** Mezcla `color` con opacidad `alfa` sobre `fondo` (composición normal, en sRGB). */
function mezclar(fondo: string, color: string, alfa: number): string {
  const c = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [f, k] = [c(fondo), c(color)];
  return (
    '#' +
    f
      .map((v, i) =>
        Math.round(v * (1 - alfa) + k[i] * alfa)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

describe('token halo y contraste sobre el fondo de marca', () => {
  const fuente = leer(path.join(SRC, 'shared/movimiento/FondoMarca.tsx'));
  const opacidadHalo =
    /OPACIDAD_HALO = \{ oscuro: ([\d.]+), claro: ([\d.]+) \}/.exec(fuente);
  const opacidadIsotipo = /OPACIDAD_ISOTIPO = ([\d.]+);/.exec(fuente);

  it('FondoMarca declara sus opacidades (el test las lee de ahí)', () => {
    expect(opacidadHalo).not.toBeNull();
    expect(opacidadIsotipo).not.toBeNull();
  });

  it('halo es el verde oficial en los dos temas', () => {
    expect(temaOscuro.colores.halo).toBe(paleta.verde);
    expect(temaClaro.colores.halo).toBe(paleta.verde);
    expect(paleta.verde.toUpperCase()).toBe('#86EF86');
  });

  const casos = [
    ['oscuro', temaOscuro, 1],
    ['claro', temaClaro, 2],
  ] as const;

  it.each(casos)(
    'en %s, el texto principal pasa AA (4.5) en el centro del halo con el isotipo encima',
    (_, tema, grupo) => {
      const alfa = Number(opacidadHalo![grupo]);
      const fondo = mezclar(
        mezclar(tema.colores.fondo, tema.colores.halo, alfa),
        tema.colores.marca,
        Number(opacidadIsotipo![1]),
      );
      expect(
        relacionContraste(tema.colores.texto, fondo),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(casos)(
    'en %s, el texto secundario pasa AA desde la parada 0.55 del halo hacia fuera',
    (_, tema, grupo) => {
      // En offset 0.55 la opacidad del gradiente es la del centro / 4 (FondoMarca.tsx).
      const alfa = Number(opacidadHalo![grupo]) / 4;
      const fondo = mezclar(
        mezclar(tema.colores.fondo, tema.colores.halo, alfa),
        tema.colores.marca,
        Number(opacidadIsotipo![1]),
      );
      expect(
        relacionContraste(tema.colores.textoSecundario, fondo),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('el anillo del splash (halo, decorativo) contrasta con el fondo oscuro', () => {
    expect(
      relacionContraste(temaOscuro.colores.halo, temaOscuro.colores.fondo),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('reduce-motion de punta a punta (CA5)', () => {
  function espiar() {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    return {
      bucle: jest.spyOn(Reanimated, 'withRepeat'),
      resorte: jest.spyOn(Reanimated, 'withSpring'),
      sacudida: jest.spyOn(Reanimated, 'withSequence'),
    };
  }

  afterEach(() => jest.restoreAllMocks());

  it.each(['oscuro', 'claro'] as ModoTema[])(
    'onboarding en %s: sin bucles (halo, isotipo, ilustraciones) ni resortes',
    async modo => {
      const { bucle, resorte } = espiar();
      await render(
        <SafeAreaProvider>
          <TemaProvider preferenciaInicial={modo}>
            <DependenciasProvider
              valor={crearDependenciasDePrueba({
                onboardingInicial: { tipo: 'pendiente' },
              })}
            >
              <NavigationContainer>
                <OnboardingScreen />
              </NavigationContainer>
            </DependenciasProvider>
          </TemaProvider>
        </SafeAreaProvider>,
      );
      expect(screen.getByTestId('lista-onboarding')).toBeOnTheScreen();
      expect(bucle).not.toHaveBeenCalled();
      expect(resorte).not.toHaveBeenCalled();
    },
  );

  it('login: sin bucles del fondo ni resortes de entrada', async () => {
    const { bucle, resorte, sacudida } = espiar();
    await render(
      <SafeAreaProvider>
        <TemaProvider preferenciaInicial="oscuro">
          <DependenciasProvider
            valor={crearDependenciasDePrueba({
              estadoInicial: { tipo: 'sinSesion' },
            })}
          >
            <NavigationContainer>
              <LoginScreen />
            </NavigationContainer>
          </DependenciasProvider>
        </TemaProvider>
      </SafeAreaProvider>,
    );
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
    expect(bucle).not.toHaveBeenCalled();
    expect(resorte).not.toHaveBeenCalled();
    expect(sacudida).not.toHaveBeenCalled();
  });
});
