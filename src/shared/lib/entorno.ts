import Config from 'react-native-config';

/** Entornos lógicos de la app (variable APP_ENV de .env). */
export type EntornoApp = 'dev' | 'staging' | 'prod';

export interface IEntorno {
  apiUrl: string;
  /** Web de Leap a la que lleva «Abrir en la web» (1.16). Por defecto, la API sin su `/api` final. */
  webUrl: string;
  appEnv: EntornoApp;
  /** Client ID web de Google (login con Google, F1-06). `null` = botón oculto. */
  googleWebClientId: string | null;
  /** Client ID de iOS de Google, si existe. */
  googleIosClientId: string | null;
  /**
   * Correo con el que entra el Google simulado mientras no hay client ID: el botón se ve y el
   * flujo funciona contra la copia de desarrollo de Leap, la única que acepta «simulado:» (con
   * LEAP_GOOGLE_SIMULADO=1). Si hay client ID real, manda el real. `null` = sin simulación.
   */
  googleSimuladoCorreo: string | null;
}

const ENTORNOS: readonly EntornoApp[] = ['dev', 'staging', 'prod'];

/**
 * Valida y normaliza las variables de entorno. Es pura para poder probarla sin el módulo nativo.
 * Lanza un error descriptivo si falta API_URL o si APP_ENV no es un entorno conocido: es un fallo
 * de configuración del build, no un error de ejecución.
 */
export function leerEntorno(
  config: Record<string, string | undefined>,
): IEntorno {
  const apiUrl = config.API_URL?.trim();
  if (!apiUrl) {
    throw new Error(
      'Falta API_URL en .env (copia .env.example y recompila la app).',
    );
  }
  const appEnv = (config.APP_ENV?.trim() || 'dev') as EntornoApp;
  if (!ENTORNOS.includes(appEnv)) {
    throw new Error(
      `APP_ENV inválido: «${
        config.APP_ENV
      }». Valores admitidos: ${ENTORNOS.join(', ')}.`,
    );
  }
  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    webUrl: (
      config.WEB_URL?.trim() || apiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
    ).replace(/\/+$/, ''),
    appEnv,
    googleWebClientId: config.GOOGLE_WEB_CLIENT_ID?.trim() || null,
    googleIosClientId: config.GOOGLE_IOS_CLIENT_ID?.trim() || null,
    googleSimuladoCorreo: config.GOOGLE_SIMULADO_CORREO?.trim() || null,
  };
}

/** Entorno de este build, leído de react-native-config. */
export const entorno: IEntorno = leerEntorno(Config);
