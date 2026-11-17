import type { SecureStoragePort } from '@/native/ports/SecureStoragePort';

import type { SesionActiva } from '../../domain/models/SesionActiva';
import type { SesionRepository } from '../../domain/models/SesionRepository';
import { debeRenovar } from '../../domain/validations/sesion.validations';
import type { RenovarSesion } from '../renovarSesion/renovarSesion';
import { restaurarSesionUseCase } from '../restaurarSesion/restaurarSesion';
import { validarSesionUseCase } from '../validarSesion/validarSesion';

export interface IArgsArrancarSesion {
  repo: SesionRepository;
  almacen: SecureStoragePort;
  sesionActiva: SesionActiva;
  renovar: RenovarSesion;
  ahora: Date;
}

/**
 * Arranque de la app: restaura la sesión guardada y la publica (el splash da paso al inicio sin
 * esperar a la red). Después la valida con `me` y, si toca, la renueva. Un 401 en cualquiera de
 * los dos ya lo limpió `alNoAutorizado`; sin red se sigue con la guardada.
 */
export async function arrancarSesionUseCase({
  repo,
  almacen,
  sesionActiva,
  renovar,
  ahora,
}: IArgsArrancarSesion): Promise<void> {
  const guardada = await restaurarSesionUseCase(almacen, ahora);
  if (!guardada) {
    sesionActiva.establecer({ tipo: 'sinSesion' });
    return;
  }
  sesionActiva.establecer({ tipo: 'autenticado', sesion: guardada });

  const validada = await validarSesionUseCase(repo, almacen, guardada);
  if (validada.error || !validada.response) {
    return;
  }
  let sesion = validada.response;
  if (debeRenovar(sesion, ahora)) {
    const renovada = await renovar(repo, almacen, sesion);
    if (renovada.error || !renovada.response) {
      return;
    }
    sesion = renovada.response;
  }
  // Solo si mientras tanto no se cerró ni se invalidó la sesión.
  if (sesionActiva.obtener().tipo === 'autenticado') {
    sesionActiva.establecer({ tipo: 'autenticado', sesion });
  }
}
