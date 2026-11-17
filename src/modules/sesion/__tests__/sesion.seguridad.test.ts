// Tester (F1-03, CA6): revisión estática de que el PIN y el token no se filtran.
// - No hay console.* en el módulo de sesión ni en sus adaptadores nativos.
// - No se añade AsyncStorage (dependencia ni import).
// - El PIN no va en los parámetros de navegación (AuthParamList / RaizParamList).
import fs from 'fs';
import path from 'path';

const RAIZ = path.resolve(__dirname, '../../../..');
const SRC = path.join(RAIZ, 'src');

function archivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) {
      return e.name === '__tests__' ? [] : archivos(ruta);
    }
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)
      ? [ruta]
      : [];
  });
}

const leer = (ruta: string) => fs.readFileSync(ruta, 'utf8');

describe('seguridad de la sesión (CA6)', () => {
  it('no hay console.* en src/modules/sesion ni en los adaptadores de almacén y enlaces', () => {
    const revisados = [
      ...archivos(path.join(SRC, 'modules', 'sesion')),
      path.join(SRC, 'native', 'adapters', 'KeychainSecureStorageAdapter.ts'),
      path.join(SRC, 'native', 'adapters', 'LinkingEnlacesAdapter.ts'),
      path.join(SRC, 'app', 'di', 'contenedor.ts'),
    ];
    expect(revisados.length).toBeGreaterThan(10);
    const conConsola = revisados.filter(r => /\bconsole\./.test(leer(r)));
    expect(conConsola).toEqual([]);
  });

  it('no se usa AsyncStorage en el código ni en package.json', () => {
    const paquete = JSON.parse(leer(path.join(RAIZ, 'package.json')));
    const deps = {
      ...paquete.dependencies,
      ...paquete.devDependencies,
    } as Record<string, string>;
    expect(Object.keys(deps).filter(d => /async-storage/i.test(d))).toEqual([]);
    const conAsync = archivos(SRC).filter(r => /AsyncStorage/.test(leer(r)));
    expect(conAsync).toEqual([]);
  });

  it('el PIN no forma parte de los parámetros de navegación', () => {
    const auth = leer(
      path.join(SRC, 'modules', 'sesion', 'presentation', 'navigation.tsx'),
    );
    const tipos = leer(path.join(SRC, 'app', 'navigation', 'tipos.ts'));
    expect(auth).toMatch(/Login:\s*undefined/);
    expect(`${auth}\n${tipos}`).not.toMatch(/\bpin\b/i);
  });

  it('la persistencia (validaciones y casos de uso) nunca serializa una clave pin', () => {
    const persistencia = [
      path.join(SRC, 'modules/sesion/domain/validations/sesion.validations.ts'),
      ...archivos(path.join(SRC, 'modules/sesion/aplications')).filter(
        r => !/controllers/.test(r),
      ),
    ];
    for (const r of persistencia) {
      // `pin` solo puede aparecer como argumento de login o en la validación, nunca en guardar().
      const guardados = leer(r).match(/guardar\([^)]*\)/g) ?? [];
      for (const g of guardados) {
        expect(g).not.toMatch(/pin/i);
      }
    }
  });
});
