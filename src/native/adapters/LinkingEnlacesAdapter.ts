import { Linking } from 'react-native';

import type { EnlacesPort } from '@/native/ports/EnlacesPort';

/**
 * Adaptador de EnlacesPort con `Linking` del core. No usa `canOpenURL`, así que Android no necesita
 * declarar `<queries>`: si no hay app que abra la URL, `openURL` rechaza y se devuelve `false`.
 */
export function crearLinkingEnlacesAdapter(): EnlacesPort {
  return {
    async abrir(url) {
      try {
        await Linking.openURL(url);
        return true;
      } catch {
        return false;
      }
    },
  };
}
