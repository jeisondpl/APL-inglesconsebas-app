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
 * los dos ya lo limpió `alNoAutorizado`; sin red se sigue con la guardada. Si mientras tanto se
 * cierra sesión o entra otro usuario (el token activo ya no es el guardado), el resultado tardío se
 * descarta: no se guarda ni se publica.
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
  const sigueVigente = () => sesionActiva.token() === guardada.token;

  const validada = await validarSesionUseCase(
    repo,
    almacen,
    guardada,
    sigueVigente,
  );
  if (validada.error || !validada.response) {
    return;
  }
  let sesion = validada.response;
  if (debeRenovar(sesion, ahora)) {
    const renovada = await renovar(repo, almacen, sesion, sigueVigente);
    if (renovada.error || !renovada.response) {
      return;
    }
    sesion = renovada.response;
  }
  // Solo si sigue siendo la misma sesión: ni cerrada, ni invalidada, ni la de otro usuario.
  if (sigueVigente()) {
    sesionActiva.establecer({ tipo: 'autenticado', sesion });
  }
}
