import * as Keychain from 'react-native-keychain';

import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

/** Prefijo del servicio de Keychain/Keystore: cada clave usa su propio servicio. */
const PREFIJO_SERVICIO = 'com.inglesconsebas.app';
/** La librería guarda pares usuario/contraseña: el usuario es fijo y el valor va como contraseña. */
const USUARIO = 'app';

const servicio = (clave: string) => `${PREFIJO_SERVICIO}.${clave}`;

/**
 * Adaptador de SecureStoragePort con react-native-keychain (MIT). Accesible tras el primer
 * desbloqueo y solo en este dispositivo; sin `accessControl`, porque la biometría es el ítem 1.13.
 * Nunca lanza: los errores del módulo nativo se convierten en `null` o `false`.
 */
export function crearKeychainSecureStorageAdapter(): SecureStoragePort {
  return {
    async leer(clave) {
      try {
        const credenciales = await Keychain.getGenericPassword({
          service: servicio(clave),
        });
        return credenciales ? credenciales.password : null;
      } catch {
        return null;
      }
    },
    async guardar(clave, valor) {
      try {
        const resultado = await Keychain.setGenericPassword(USUARIO, valor, {
          service: servicio(clave),
          accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
        return resultado !== false;
      } catch {
        return false;
      }
    },
    async borrar(clave) {
      try {
        await Keychain.resetGenericPassword({ service: servicio(clave) });
      } catch {
        // Sin valor que borrar o módulo nativo no disponible: no hay nada que hacer.
      }
    },
  };
}
