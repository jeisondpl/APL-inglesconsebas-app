import BootSplash from 'react-native-bootsplash';

import type { SplashPort } from '@/native/ports/SplashPort';

/**
 * Adaptador de SplashPort con react-native-bootsplash (MIT). Nunca lanza: si el módulo nativo
 * falla, el splash ya no bloquea nada y la app sigue.
 */
export function crearBootSplashAdapter(): SplashPort {
  return {
    async ocultar(opciones) {
      try {
        await BootSplash.hide({ fade: opciones?.fundido ?? false });
      } catch {
        // Sin splash que ocultar o módulo nativo no disponible: no hay nada que hacer.
      }
    },
  };
}
