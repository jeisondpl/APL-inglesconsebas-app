import type { RolUsuario } from '@/modules/sesion/domain/entities/Sesion.entities';

import type { AppParamList } from './tipos';

export type RutaInicio = Extract<
  keyof AppParamList,
  'InicioEstudiante' | 'InicioProfe' | 'InicioAdmin'
>;

const RUTAS: Record<RolUsuario, RutaInicio> = {
  estudiante: 'InicioEstudiante',
  profe: 'InicioProfe',
  admin: 'InicioAdmin',
};

/** Ruta de inicio del flujo App según el rol. */
export function rutaInicioPorRol(rol: RolUsuario): RutaInicio {
  return RUTAS[rol];
}
