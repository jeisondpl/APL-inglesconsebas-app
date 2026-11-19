import ReactNativeBlobUtil from 'react-native-blob-util';

import type { CacheLocalPort } from '@/native/ports/CacheLocalPort';

const SUBCARPETA = 'cache-local';

/**
 * Nombre de archivo estable y seguro para cualquier clave: dos hashes polinómicos (módulos primos
 * distintos) y la longitud, en hexadecimal. Los choques entre claves reales son prácticamente nulos.
 */
export function nombreDeArchivo(clave: string): string {
  let h1 = 7;
  let h2 = 13;
  for (let i = 0; i < clave.length; i += 1) {
    const c = clave.charCodeAt(i);
    h1 = (h1 * 31 + c) % 1000000007;
    h2 = (h2 * 131 + c) % 998244353;
  }
  return `${h1.toString(16)}${h2.toString(16)}-${clave.length.toString(
    16,
  )}.json`;
}

/**
 * Adaptador de CacheLocalPort con archivos de `react-native-blob-util` en la carpeta de documentos
 * de la app (privada, sin copia de seguridad en Android). Un archivo por clave.
 */
export function crearBlobUtilCacheLocalAdapter(): CacheLocalPort {
  const carpeta = () =>
    `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${SUBCARPETA}`;
  const ruta = (clave: string) => `${carpeta()}/${nombreDeArchivo(clave)}`;
  return {
    async leer(clave) {
      try {
        const archivo = ruta(clave);
        if (!(await ReactNativeBlobUtil.fs.exists(archivo))) {
          return null;
        }
        return await ReactNativeBlobUtil.fs.readFile(archivo, 'utf8');
      } catch {
        return null;
      }
    },
    async guardar(clave, valor) {
      try {
        if (!(await ReactNativeBlobUtil.fs.exists(carpeta()))) {
          await ReactNativeBlobUtil.fs.mkdir(carpeta());
        }
        await ReactNativeBlobUtil.fs.writeFile(ruta(clave), valor, 'utf8');
      } catch {
        // Sin espacio o sin permiso: simplemente no queda en caché.
      }
    },
    async limpiar() {
      try {
        if (await ReactNativeBlobUtil.fs.exists(carpeta())) {
          await ReactNativeBlobUtil.fs.unlink(carpeta());
        }
      } catch {
        // Nada que borrar o no se pudo: la caché va por persona, así que no se mezcla.
      }
    },
  };
}
