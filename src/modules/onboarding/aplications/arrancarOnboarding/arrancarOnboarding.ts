import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

import type { BanderaOnboarding } from '../../domain/models/BanderaOnboarding';
import {
  CLAVE_ONBOARDING_VISTO,
  onboardingVisto,
} from '../../domain/validations/onboarding.validations';

/**
 * Lee la bandera al arrancar. Solo actúa con el estado `cargando`. El almacén nunca rechaza: si la
 * lectura falla devuelve `null`, que cuenta como pendiente (se muestra la bienvenida).
 */
export async function arrancarOnboardingUseCase(args: {
  almacen: SecureStoragePort;
  bandera: BanderaOnboarding;
}): Promise<void> {
  const { almacen, bandera } = args;
  if (bandera.obtener().tipo !== 'cargando') {
    return;
  }
  const texto = await almacen.leer(CLAVE_ONBOARDING_VISTO);
  // Otra vía (marcar visto) pudo resolver la bandera mientras se leía: no se pisa.
  if (bandera.obtener().tipo !== 'cargando') {
    return;
  }
  bandera.establecer({ tipo: onboardingVisto(texto) ? 'visto' : 'pendiente' });
}
