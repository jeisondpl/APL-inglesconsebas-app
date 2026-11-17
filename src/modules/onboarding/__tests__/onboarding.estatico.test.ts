// Constructor (EXT-01): revisión estática del módulo de la bienvenida.
// CA13: ningún color hex (solo tokens del tema). CA16: ninguna mención al almacén no cifrado.
import fs from 'fs';
import path from 'path';

const MODULO = path.resolve(__dirname, '..');

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

describe('módulo onboarding: revisión estática', () => {
  const revisados = archivos(MODULO);

  it('revisa el módulo completo', () => {
    expect(revisados.length).toBeGreaterThan(10);
  });

  it('no hay colores hex (CA13)', () => {
    const conHex = revisados.filter(r => /#[0-9a-fA-F]{3,8}\b/.test(leer(r)));
    expect(conHex).toEqual([]);
  });

  it('no se menciona el almacén no cifrado (CA16)', () => {
    const prohibido = new RegExp(['Async', 'Storage'].join(''));
    const conAsync = revisados.filter(r => prohibido.test(leer(r)));
    expect(conAsync).toEqual([]);
  });
});
