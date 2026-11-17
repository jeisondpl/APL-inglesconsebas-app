// Tester (F1-04): el splash JS se va siempre (CA8, CA9). Restauración que falla, que no llega con
// reduce-motion, que llega durante el tope, `alTerminar` que cambia de identidad y que el splash
// nunca bloquea los toques una vez empezada la salida. Con fake timers.
import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import { crearDependenciasDePrueba } from '@/app/di/dependenciasDePrueba';
import { Providers } from '@/app/providers';
import {
  ESPERA_MAXIMA_MS,
  MINIMO_SPLASH_MS,
  MINIMO_SPLASH_REDUCIDO_MS,
  RaizConSplash,
  SALIDA_MS,
  SplashAnimado,
} from '@/app/splash';
import { temaClaro, temaOscuro } from '@/shared/theme';

const oculto = { includeHiddenElements: true } as const;

/**
 * Avanza el reloj en pasos de 50 ms, cada uno en su `act`: así los efectos que programan el tope
 * (dependen del estado que pone el temporizador del mínimo) corren entre paso y paso, como en el
 * dispositivo. Un solo `advanceTimersByTime` gigante no deja que se programen.
 */
const PASO_MS = 50;

async function avanzar(ms: number) {
  let resto = ms;
  while (resto > 0) {
    const paso = Math.min(PASO_MS, resto);
    resto -= paso;
    await act(async () => {
      jest.advanceTimersByTime(paso);
    });
  }
}

const splashFalso = () => ({ ocultar: jest.fn(() => Promise.resolve()) });

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function montar(
  props: { listo: boolean; alTerminar: () => void },
  splash = splashFalso(),
) {
  const dependencias = crearDependenciasDePrueba({ splash });
  return render(
    <Providers dependencias={dependencias} preferenciaTema="oscuro">
      <SplashAnimado {...props} />
    </Providers>,
  ).then(u => ({ ...u, dependencias, splash }));
}

describe('SplashAnimado nunca se cuelga (CA8)', () => {
  it('la restauración llega durante el tope: sale entonces y una sola vez', async () => {
    const alTerminar = jest.fn();
    const u = await montar({ listo: false, alTerminar });
    await avanzar(MINIMO_SPLASH_MS + 500);
    expect(alTerminar).not.toHaveBeenCalled();
    await u.rerender(
      <Providers dependencias={u.dependencias} preferenciaTema="oscuro">
        <SplashAnimado listo alTerminar={alTerminar} />
      </Providers>,
    );
    await avanzar(SALIDA_MS);
    expect(alTerminar).toHaveBeenCalledTimes(1);
    // El tope que quedaba pendiente no provoca una segunda salida.
    await avanzar(ESPERA_MAXIMA_MS * 3);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('con reduce-motion y sin restauración: sale a los 600 + 1200 + salida', async () => {
    jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const alTerminar = jest.fn();
    await montar({ listo: false, alTerminar });
    // Antes de agotarse el tope no sale; después sale (con el margen de un paso de reloj).
    await avanzar(MINIMO_SPLASH_REDUCIDO_MS + ESPERA_MAXIMA_MS - 1);
    expect(alTerminar).not.toHaveBeenCalled();
    await avanzar(SALIDA_MS + PASO_MS);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('el tope máximo total es mínimo + espera + salida (< 3.6 s)', () => {
    expect(MINIMO_SPLASH_MS).toBe(1900);
    expect(MINIMO_SPLASH_REDUCIDO_MS).toBe(600);
    expect(ESPERA_MAXIMA_MS).toBe(1200);
    expect(MINIMO_SPLASH_MS + ESPERA_MAXIMA_MS + SALIDA_MS).toBeLessThan(3600);
  });

  it('si alTerminar cambia mientras espera, llama a la última', async () => {
    const primera = jest.fn();
    const ultima = jest.fn();
    const u = await montar({ listo: true, alTerminar: primera });
    await u.rerender(
      <Providers dependencias={u.dependencias} preferenciaTema="oscuro">
        <SplashAnimado listo alTerminar={ultima} />
      </Providers>,
    );
    await avanzar(MINIMO_SPLASH_MS + SALIDA_MS);
    expect(primera).not.toHaveBeenCalled();
    expect(ultima).toHaveBeenCalledTimes(1);
  });

  it('si `listo` vuelve a false durante la salida, la salida sigue', async () => {
    const alTerminar = jest.fn();
    const u = await montar({ listo: true, alTerminar });
    await avanzar(MINIMO_SPLASH_MS);
    await u.rerender(
      <Providers dependencias={u.dependencias} preferenciaTema="oscuro">
        <SplashAnimado listo={false} alTerminar={alTerminar} />
      </Providers>,
    );
    await avanzar(SALIDA_MS);
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });

  it('bloquea los toques mientras espera y los suelta al empezar a salir', async () => {
    await montar({ listo: false, alTerminar: jest.fn() });
    const raiz = () => screen.getByTestId('splash-animado', oculto);
    expect(raiz().props.pointerEvents).toBe('auto');
    await avanzar(MINIMO_SPLASH_MS + ESPERA_MAXIMA_MS + PASO_MS);
    expect(raiz().props.pointerEvents).toBe('none');
  });
});

/** Almacén que responde `valor` a los `ms` (el adaptador real nunca rechaza: falla con `null`). */
const almacenLento = (ms: number, valor: string | null = null) => ({
  leer: () =>
    new Promise<string | null>(resolver =>
      setTimeout(() => resolver(valor), ms),
    ),
  guardar: () => Promise.resolve(true),
  borrar: () => Promise.resolve(),
});

describe('RaizConSplash: restauración que falla o tarda (CA8, CA9)', () => {
  it('si la lectura del Keychain falla (el adaptador devuelve null), sale tras el mínimo al login', async () => {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'restaurando' },
      onboardingInicial: { tipo: 'cargando' },
      splash: splashFalso(),
      almacen: almacenLento(0),
    });
    await render(
      <Providers dependencias={dependencias} preferenciaTema="oscuro">
        <RaizConSplash />
      </Providers>,
    );
    await avanzar(MINIMO_SPLASH_MS - PASO_MS);
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
    await avanzar(PASO_MS + SALIDA_MS + PASO_MS);
    expect(screen.queryByTestId('splash-animado', oculto)).toBeNull();
    // Sin bandera guardada, la primera vez va a la bienvenida.
    expect(screen.getByTestId('lista-onboarding')).toBeOnTheScreen();
  });

  it('si la restauración tarda más que el tope, el splash sale y luego aparece el login', async () => {
    const dependencias = crearDependenciasDePrueba({
      estadoInicial: { tipo: 'restaurando' },
      splash: splashFalso(),
      almacen: almacenLento(6000),
    });
    await render(
      <Providers dependencias={dependencias} preferenciaTema="oscuro">
        <RaizConSplash />
      </Providers>,
    );
    await avanzar(MINIMO_SPLASH_MS + ESPERA_MAXIMA_MS - 1);
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
    await avanzar(SALIDA_MS + PASO_MS);
    expect(screen.queryByTestId('splash-animado', oculto)).toBeNull();
    // Mientras tanto NavegadorRaiz no pinta (contrato de CA9): queda el fondo del tema.
    expect(screen.queryByText('Inicia sesión')).toBeNull();
    await avanzar(6000);
    expect(screen.getByText('Inicia sesión')).toBeOnTheScreen();
  });

  it('si la bandera de la bienvenida no carga nunca, el splash sale por el tope', async () => {
    const dependencias = crearDependenciasDePrueba({
      splash: splashFalso(),
      onboardingInicial: { tipo: 'cargando' },
      almacen: {
        leer: () => new Promise<string | null>(() => {}),
        guardar: () => Promise.resolve(true),
        borrar: () => Promise.resolve(),
      },
    });
    await render(
      <Providers dependencias={dependencias} preferenciaTema="oscuro">
        <RaizConSplash />
      </Providers>,
    );
    await avanzar(MINIMO_SPLASH_MS + ESPERA_MAXIMA_MS - 1);
    expect(screen.getByTestId('splash-animado', oculto)).toBeTruthy();
    await avanzar(SALIDA_MS + PASO_MS);
    expect(screen.queryByTestId('splash-animado', oculto)).toBeNull();
  });
});

describe('SplashAnimado: colores por token (CA7, CA14)', () => {
  it.each([
    ['oscuro', temaOscuro],
    ['claro', temaClaro],
  ] as const)(
    'en %s, fondo y anillo salen de los tokens (halo incluido)',
    async (modo, tema) => {
      const dependencias = crearDependenciasDePrueba({ splash: splashFalso() });
      await render(
        <Providers dependencias={dependencias} preferenciaTema={modo}>
          <SplashAnimado listo={false} alTerminar={jest.fn()} />
        </Providers>,
      );
      const raiz = screen.getByTestId('splash-animado', oculto);
      const colores = new Set<string>();
      const recorrer = (n: typeof raiz) => {
        const e = StyleSheet.flatten(n.props.style) ?? {};
        for (const c of [e.backgroundColor, e.borderColor]) {
          // `transparent` lo pone react-native-svg en su vista contenedora.
          if (typeof c === 'string' && c !== 'transparent') {
            colores.add(c);
          }
        }
        for (const h of n.children) {
          if (typeof h !== 'string') {
            recorrer(h);
          }
        }
      };
      recorrer(raiz);
      // Fondo del tema y anillo con el token halo.
      expect(colores).toContain(tema.colores.fondo);
      expect(colores).toContain(tema.colores.halo);
      for (const c of colores) {
        expect(Object.values(tema.colores)).toContain(c);
      }
    },
  );
});
