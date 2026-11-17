// Tester (EXT-01): CA13 y CA16 más allá del hex. Un color también entra como rgb()/hsl(), como
// nombre ('white', 'black'…) o como literal en `fill`/`stroke`/`color`. En el módulo solo se admite
// `fill="none"` (transparente, no es un color) y los nombres de token en la prop `color` de
// `Texto`. CA16: sin dependencias nuevas frente a main, que se verifica fuera (git diff).
import fs from 'fs';
import path from 'path';

const MODULO = path.resolve(__dirname, '..');
const PRESENTACION = path.join(MODULO, 'presentation');

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) {
      return e.name === '__tests__' ? [] : archivos(ruta);
    }
    return /\.(ts|tsx)$/.test(e.name) ? [ruta] : [];
  });
}

const leer = (ruta: string) => fs.readFileSync(ruta, 'utf8');
const relativo = (ruta: string) => path.relative(MODULO, ruta);

function conPatron(rutas: string[], patron: RegExp): string[] {
  return rutas.flatMap(r =>
    leer(r)
      .split('\n')
      .map((linea, i) => ({ linea, i }))
      .filter(({ linea }) => patron.test(linea))
      .map(({ linea, i }) => `${relativo(r)}:${i + 1}: ${linea.trim()}`),
  );
}

describe('onboarding: colores solo por token (CA13)', () => {
  const todos = archivos(MODULO);
  const presentacion = archivos(PRESENTACION);

  it('la capa de presentación tiene pantalla, componentes e ilustraciones', () => {
    const nombres = presentacion.map(r => path.basename(r));
    expect(nombres).toEqual(
      expect.arrayContaining([
        'OnboardingScreen.tsx',
        'IlustracionClases.tsx',
        'IlustracionMensajes.tsx',
        'IlustracionTareas.tsx',
        'IndicadorPaginas.tsx',
        'PaginaOnboarding.tsx',
      ]),
    );
  });

  it('no hay colores rgb()/rgba()/hsl()/hsla()', () => {
    expect(conPatron(todos, /\b(rgba?|hsla?)\s*\(/i)).toEqual([]);
  });

  it('no hay colores con nombre CSS', () => {
    expect(
      conPatron(
        todos,
        /['"](white|black|red|green|blue|gray|grey|yellow|orange|silver|lime|transparent)['"]/i,
      ),
    ).toEqual([]);
  });

  it('fill y stroke solo reciben tokens del tema o «none»', () => {
    const literales = conPatron(presentacion, /\b(fill|stroke)=["']/).filter(
      l => !/\bfill=["']none["']/.test(l),
    );
    expect(literales).toEqual([]);
  });

  it('las ilustraciones toman los colores de useTema()', () => {
    for (const nombre of [
      'IlustracionClases.tsx',
      'IlustracionMensajes.tsx',
      'IlustracionTareas.tsx',
    ]) {
      const fuente = leer(
        path.join(PRESENTACION, 'components', 'ilustraciones', nombre),
      );
      expect(fuente).toMatch(/useTema\(\)/);
      expect(fuente).toMatch(/fill=\{c\.\w+\}/);
    }
  });

  it('los estilos (color, backgroundColor, borderColor) solo usan tema.colores', () => {
    const malos = conPatron(
      presentacion,
      /\b(color|backgroundColor|borderColor|tintColor|shadowColor)\s*:(?!\s*tema\.colores\.)/,
    );
    expect(malos).toEqual([]);
  });
});
