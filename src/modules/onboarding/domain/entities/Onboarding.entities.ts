/**
 * Estado de la bienvenida (EXT-01). La feature no consume API: no hay `IArgs*` ni `IResponse*`.
 * cargando: aún no se leyó la bandera; pendiente: no la hay; visto: guardada o recién marcada.
 */
export type EstadoOnboarding =
  | { tipo: 'cargando' }
  | { tipo: 'pendiente' }
  | { tipo: 'visto' };
