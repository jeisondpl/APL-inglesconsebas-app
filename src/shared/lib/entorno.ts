import Config from 'react-native-config';

/** Entornos lógicos de la app (variable APP_ENV de .env). */
export type EntornoApp = 'dev' | 'staging' | 'prod';

export interface IEntorno {
  apiUrl: string;
  appEnv: EntornoApp;
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
  return { apiUrl: apiUrl.replace(/\/+$/, ''), appEnv };
}

/** Entorno de este build, leído de react-native-config. */
export const entorno: IEntorno = leerEntorno(Config);
