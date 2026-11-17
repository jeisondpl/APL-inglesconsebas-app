import type { EstadoOnboarding } from '@/modules/onboarding/domain/entities/Onboarding.entities';
import { debeMostrarOnboarding } from '@/modules/onboarding/domain/validations/onboarding.validations';
import type { EstadoSesion } from '@/modules/sesion/domain/entities/Sesion.entities';
import { rutaInicialAuth } from '@/modules/sesion/presentation/navigation';

import { rutaInicioPorRol } from './rutaInicioPorRol';
import type { RaizParamList } from './tipos';

/**
 * Ruta inicial del navegador raíz, una vez leídas la sesión y la bandera de la bienvenida:
 * el inicio del rol si hay sesión; la bienvenida si toca (EXT-01); si no, la de Auth (F1-03).
 */
export function rutaInicialRaiz(args: {
  estadoSesion: Exclude<EstadoSesion, { tipo: 'restaurando' }>;
  onboarding: Exclude<EstadoOnboarding, { tipo: 'cargando' }>;
}): keyof RaizParamList {
  const { estadoSesion, onboarding } = args;
  if (estadoSesion.tipo === 'autenticado') {
    return rutaInicioPorRol(estadoSesion.sesion.usuario.rol);
  }
  if (debeMostrarOnboarding(onboarding, false)) {
    return 'Onboarding';
  }
  return rutaInicialAuth();
}
