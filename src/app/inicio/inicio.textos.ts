import type { RolUsuario } from '@/modules/sesion/domain/entities/Sesion.entities';

const ROLES: Record<RolUsuario, string> = {
  estudiante: 'Estudiante',
  profe: 'Profe',
  admin: 'Admin',
};

/** Textos de la pantalla de inicio provisional. */
export const textosInicio = {
  saludo: (nombre: string) => `Hola, ${nombre}`,
  rol: (rol: RolUsuario) => `Rol: ${ROLES[rol]}`,
  subtitulo:
    'Inicio provisional. El inicio de cada rol llega con las próximas features.',
  version: (version: string) => `Versión ${version}`,
  entorno: (entorno: string) => `Entorno: ${entorno}`,
  servidor: (host: string) => `Servidor: ${host}`,
  verSistemaDiseno: 'Ver sistema de diseño',
  cerrarSesion: 'Cerrar sesión',
} as const;
