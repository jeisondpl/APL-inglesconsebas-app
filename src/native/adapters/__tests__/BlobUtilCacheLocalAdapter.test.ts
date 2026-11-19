// F1-03b (1.15): caché local en archivos. Nunca rechaza.
import ReactNativeBlobUtil from 'react-native-blob-util';

import {
  crearBlobUtilCacheLocalAdapter,
  nombreDeArchivo,
} from '@/native/adapters/BlobUtilCacheLocalAdapter';

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { DocumentDir: '/docs' },
      exists: jest.fn(),
      mkdir: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
      unlink: jest.fn(),
    },
  },
}));

const fs = ReactNativeBlobUtil.fs as unknown as Record<string, jest.Mock>;

beforeEach(() => {
  Object.values(fs).forEach(f => {
    if (typeof f?.mockReset === 'function') {
      f.mockReset();
    }
  });
});

describe('nombreDeArchivo', () => {
  it('es estable, sin caracteres raros y distinto por clave', () => {
    const a = nombreDeArchivo('ana|api.php?endpoint=x&y=1');
    expect(a).toBe(nombreDeArchivo('ana|api.php?endpoint=x&y=1'));
    expect(a).toMatch(/^[0-9a-f]+-[0-9a-f]+\.json$/);
    expect(a).not.toBe(nombreDeArchivo('ana|api.php?endpoint=x&y=2'));
  });
});

describe('CacheLocal con blob-util', () => {
  it('guarda creando la carpeta y lee lo guardado', async () => {
    fs.exists.mockResolvedValueOnce(false);
    const cache = crearBlobUtilCacheLocalAdapter();
    await cache.guardar('k', 'texto');
    expect(fs.mkdir).toHaveBeenCalledWith('/docs/cache-local');
    expect(fs.writeFile).toHaveBeenCalledWith(
      `/docs/cache-local/${nombreDeArchivo('k')}`,
      'texto',
      'utf8',
    );
    fs.exists.mockResolvedValueOnce(true);
    fs.readFile.mockResolvedValueOnce('texto');
    await expect(cache.leer('k')).resolves.toBe('texto');
  });

  it('con la carpeta ya creada no la vuelve a crear', async () => {
    fs.exists.mockResolvedValueOnce(true);
    await crearBlobUtilCacheLocalAdapter().guardar('k', 'v');
    expect(fs.mkdir).not.toHaveBeenCalled();
  });

  it('leer sin archivo o con fallo da null; guardar con fallo no rechaza', async () => {
    const cache = crearBlobUtilCacheLocalAdapter();
    fs.exists.mockResolvedValueOnce(false);
    await expect(cache.leer('k')).resolves.toBeNull();
    fs.exists.mockRejectedValueOnce(new Error('x'));
    await expect(cache.leer('k')).resolves.toBeNull();
    fs.exists.mockRejectedValueOnce(new Error('x'));
    await expect(cache.guardar('k', 'v')).resolves.toBeUndefined();
  });

  it('limpiar borra la carpeta si existe y no rechaza si falla', async () => {
    const cache = crearBlobUtilCacheLocalAdapter();
    fs.exists.mockResolvedValueOnce(true);
    await cache.limpiar();
    expect(fs.unlink).toHaveBeenCalledWith('/docs/cache-local');
    fs.exists.mockResolvedValueOnce(false);
    await cache.limpiar();
    expect(fs.unlink).toHaveBeenCalledTimes(1);
    fs.exists.mockRejectedValueOnce(new Error('x'));
    await expect(cache.limpiar()).resolves.toBeUndefined();
  });
});
