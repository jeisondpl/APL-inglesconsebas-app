/** Textos de la pantalla de inicio provisional. */
export const textosInicio = {
  subtitulo:
    'Base técnica lista. Esta pantalla se sustituye con la feature de sesión.',
  version: (version: string) => `Versión ${version}`,
  entorno: (entorno: string) => `Entorno: ${entorno}`,
  servidor: (host: string) => `Servidor: ${host}`,
} as const;
