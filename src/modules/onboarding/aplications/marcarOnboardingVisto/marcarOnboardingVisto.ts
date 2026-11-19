import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

import type { BanderaOnboarding } from '../../domain/models/BanderaOnboarding';
import {
  CLAVE_ONBOARDING_VISTO,
  VALOR_ONBOARDING_VISTO,
} from '../../domain/validations/onboarding.validations';

/**
 * Marca la bienvenida como vista. El estado pasa a `visto` antes del `await`, para que la interfaz
 * avance al instante, y luego se guarda. Devuelve lo que devuelva `guardar`: si falla, se sigue en
 * `visto` en memoria y en el siguiente arranque la bienvenida vuelve a mostrarse (CA10). Es
 * idempotente: guarda aunque ya estuviera en `visto`.
 */
export function marcarOnboardingVistoUseCase(
  almacen: SecureStoragePort,
  bandera: BanderaOnboarding,
): Promise<boolean> {
  if (bandera.obtener().tipo !== 'visto') {
    bandera.establecer({ tipo: 'visto' });
  }
  return almacen.guardar(CLAVE_ONBOARDING_VISTO, VALOR_ONBOARDING_VISTO);
}
